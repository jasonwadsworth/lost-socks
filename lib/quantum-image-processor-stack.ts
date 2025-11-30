import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import * as path from 'path';

export interface QuantumImageProcessorStackProps extends cdk.StackProps {
  cognitoUserPoolArn?: string;
}

export class QuantumImageProcessorStack extends cdk.Stack {
  public readonly metadataTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: QuantumImageProcessorStackProps) {
    super(scope, id, props);

    // S3 Buckets
    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{
        transitions: [{
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        }],
      }],
      eventBridgeEnabled: true,
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
    });

    const archiveBucket = new s3.Bucket(this, 'ArchiveBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // DynamoDB Table
    this.metadataTable = new dynamodb.Table(this, 'MetadataTable', {
      partitionKey: { name: 'imageKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    this.metadataTable.addGlobalSecondaryIndex({
      indexName: 'status-uploadTimestamp-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'uploadTimestamp', type: dynamodb.AttributeType.STRING },
    });

    // SQS Queues
    const dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(14),
    });

    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 3 },
    });

    // SNS Topic
    const notificationTopic = new sns.Topic(this, 'NotificationTopic');

    // Sharp Lambda Layer
    const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/layers/sharp')),
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    });

    // Common Lambda props
    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        METADATA_TABLE: this.metadataTable.tableName,
        UPLOAD_BUCKET: uploadBucket.bucketName,
        ARCHIVE_BUCKET: archiveBucket.bucketName,
      },
    };

    // Lambda Functions
    const validateLambda = new lambda.Function(this, 'ValidateLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/validate')),
    });

    const metadataLambda = new lambda.Function(this, 'MetadataLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/metadata')),
      layers: [sharpLayer],
      memorySize: 1024,
    });

    const resizeLambda = new lambda.Function(this, 'ResizeLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/resize')),
      layers: [sharpLayer],
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
    });

    const thumbnailLambda = new lambda.Function(this, 'ThumbnailLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/thumbnail')),
      layers: [sharpLayer],
      memorySize: 1024,
    });

    const archiveLambda = new lambda.Function(this, 'ArchiveLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/archive')),
    });

    // Pre-signed URL Lambda
    const getUploadUrlLambda = new lambda.Function(this, 'GetUploadUrlLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/get-upload-url')),
    });

    // Grant permissions
    uploadBucket.grantRead(validateLambda);
    uploadBucket.grantRead(metadataLambda);
    uploadBucket.grantRead(resizeLambda);
    uploadBucket.grantRead(thumbnailLambda);
    uploadBucket.grantReadWrite(archiveLambda);
    uploadBucket.grantPut(getUploadUrlLambda);
    archiveBucket.grantWrite(archiveLambda);
    
    [validateLambda, metadataLambda, resizeLambda, thumbnailLambda, archiveLambda].forEach(fn => {
      this.metadataTable.grantReadWriteData(fn);
    });

    // Step Functions State Machine
    const retryConfig = {
      errors: ['States.TaskFailed', 'Lambda.ServiceException'],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2,
    };

    const handleError = new tasks.SnsPublish(this, 'HandleError', {
      topic: notificationTopic,
      message: sfn.TaskInput.fromJsonPathAt('$'),
      subject: 'Image Processing Failed',
    });

    const validateTask = new tasks.LambdaInvoke(this, 'ValidateImage', {
      lambdaFunction: validateLambda,
      outputPath: '$.Payload',
    }).addRetry(retryConfig).addCatch(handleError, { resultPath: '$.error' });

    const metadataTask = new tasks.LambdaInvoke(this, 'ExtractMetadata', {
      lambdaFunction: metadataLambda,
      outputPath: '$.Payload',
    }).addRetry(retryConfig).addCatch(handleError, { resultPath: '$.error' });

    const resizeTask = new tasks.LambdaInvoke(this, 'ResizeImage', {
      lambdaFunction: resizeLambda,
      outputPath: '$.Payload',
    }).addRetry(retryConfig);

    const thumbnailTask = new tasks.LambdaInvoke(this, 'GenerateThumbnail', {
      lambdaFunction: thumbnailLambda,
      outputPath: '$.Payload',
    }).addRetry(retryConfig);

    const parallelProcessing = new sfn.Parallel(this, 'ParallelProcessing')
      .branch(resizeTask)
      .branch(thumbnailTask)
      .addCatch(handleError, { resultPath: '$.error' });

    const archiveTask = new tasks.LambdaInvoke(this, 'ArchiveImage', {
      lambdaFunction: archiveLambda,
      outputPath: '$.Payload',
    }).addRetry(retryConfig).addCatch(handleError, { resultPath: '$.error' });

    const publishSuccess = new tasks.SnsPublish(this, 'PublishSuccess', {
      topic: notificationTopic,
      message: sfn.TaskInput.fromJsonPathAt('$'),
      subject: 'Image Processing Completed',
    });

    const definition = validateTask
      .next(metadataTask)
      .next(parallelProcessing)
      .next(archiveTask)
      .next(publishSuccess);

    const stateMachine = new sfn.StateMachine(this, 'ProcessingPipeline', {
      definition,
      stateMachineType: sfn.StateMachineType.EXPRESS,
      timeout: cdk.Duration.minutes(5),
    });

    // SQS Trigger Lambda
    const sqsTriggerLambda = new lambda.Function(this, 'SqsTriggerLambda', {
      ...lambdaDefaults,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../backend/src/lambda/quantum-processor/sqs-trigger')),
      environment: {
        ...lambdaDefaults.environment,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
      },
    });

    stateMachine.grantStartExecution(sqsTriggerLambda);
    sqsTriggerLambda.addEventSource(new lambdaEventSources.SqsEventSource(processingQueue, {
      batchSize: 1,
    }));

    // EventBridge Rule: S3 ObjectCreated → SQS
    new events.Rule(this, 'S3UploadRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: { bucket: { name: [uploadBucket.bucketName] } },
      },
      targets: [new targets.SqsQueue(processingQueue)],
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'ImageProcessorApi', {
      restApiName: 'Quantum Image Processor API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Cognito Authorizer (import by ARN if provided, otherwise create new)
    const userPoolArn = props?.cognitoUserPoolArn || this.node.tryGetContext('cognitoUserPoolArn');
    let authorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;

    if (userPoolArn) {
      const userPool = cognito.UserPool.fromUserPoolArn(this, 'ImportedUserPool', userPoolArn);
      authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
        cognitoUserPools: [userPool],
      });
    }

    // GET /upload-url endpoint
    const uploadUrlResource = api.root.addResource('upload-url');
    uploadUrlResource.addMethod('GET', new apigateway.LambdaIntegration(getUploadUrlLambda), {
      authorizer,
      authorizationType: authorizer ? apigateway.AuthorizationType.COGNITO : apigateway.AuthorizationType.NONE,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UploadBucketName', { value: uploadBucket.bucketName });
    new cdk.CfnOutput(this, 'ArchiveBucketName', { value: archiveBucket.bucketName });
    new cdk.CfnOutput(this, 'MetadataTableName', { value: this.metadataTable.tableName });
    new cdk.CfnOutput(this, 'StateMachineArn', { value: stateMachine.stateMachineArn });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}
