import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AIPasswordValidatorStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Lambda function for AI-powered password validation
        const preSignUpLambda = new lambda.Function(this, 'PreSignUpFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lambda/dist', {
                exclude: [
                    '*.ts',
                    '*.map',
                ],
            }),
            timeout: cdk.Duration.seconds(30),
            environment: {
                BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
                MIN_PASSWORD_LENGTH: '8',
                BEDROCK_REGION: this.region,
            },
            description: 'AI-powered password validation using Amazon Bedrock - because simple character counting is too mainstream',
        });

        // Grant Bedrock permissions to Lambda
        preSignUpLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['bedrock:InvokeModel'],
                resources: ['*'], // In production, scope this to specific model ARNs
                effect: iam.Effect.ALLOW,
            })
        );

        // Cognito User Pool with AI-powered password validation
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'AIPasswordValidatorUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            lambdaTriggers: {
                preSignUp: preSignUpLambda,
            },
        });

        // User Pool Client for application integration
        const userPoolClient = userPool.addClient('AppClient', {
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });

        // CloudFormation Outputs
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: 'AIPasswordValidator-UserPoolId',
        });

        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: 'AIPasswordValidator-UserPoolClientId',
        });

        new cdk.CfnOutput(this, 'LambdaFunctionArn', {
            value: preSignUpLambda.functionArn,
            description: 'Pre Sign-up Lambda Function ARN',
            exportName: 'AIPasswordValidator-LambdaArn',
        });
    }
}
