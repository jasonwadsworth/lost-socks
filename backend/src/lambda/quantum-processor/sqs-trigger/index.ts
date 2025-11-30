import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent } from 'aws-lambda';
import { log } from '../../../lib/logger';

const sfn = new SFNClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN!;
const TABLE_NAME = process.env.METADATA_TABLE!;

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const detail = body.detail || body;
    const imageKey = detail.object?.key || detail.imageKey;
    const bucket = detail.bucket?.name || detail.bucket;
    const size = detail.object?.size || detail.size || 0;
    const contentType = detail.object?.['content-type'] || 'image/jpeg';

    log('INFO', 'Processing SQS message', { imageKey, bucket });

    // Create initial metadata record
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        imageKey,
        uploadTimestamp: new Date().toISOString(),
        status: 'PROCESSING',
        contentType,
        size,
        stages: {},
      },
    }));

    // Start Step Functions execution
    await sfn.send(new StartExecutionCommand({
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify({ imageKey, bucket, uploadTimestamp: new Date().toISOString(), contentType, size }),
    }));

    log('INFO', 'Started Step Functions execution', { imageKey });
  }
};
