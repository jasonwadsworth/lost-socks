import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.METADATA_TABLE!;

export const updateStageStatus = async (
  imageKey: string,
  stage: string,
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
  extra: Record<string, unknown> = {}
) => {
  await client.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { imageKey },
    UpdateExpression: 'SET stages.#stage = :stageInfo',
    ExpressionAttributeNames: { '#stage': stage },
    ExpressionAttributeValues: {
      ':stageInfo': { status, timestamp: new Date().toISOString(), ...extra },
    },
  }));
};

export const updateStatus = async (imageKey: string, status: string, extra: Record<string, unknown> = {}) => {
  const updates = Object.entries(extra).map(([k], i) => `#k${i} = :v${i}`).join(', ');
  const names = Object.fromEntries(Object.keys(extra).map((k, i) => [`#k${i}`, k]));
  const values = Object.fromEntries(Object.entries(extra).map(([, v], i) => [`:v${i}`, v]));

  await client.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { imageKey },
    UpdateExpression: `SET #status = :status${updates ? ', ' + updates : ''}`,
    ExpressionAttributeNames: { '#status': 'status', ...names },
    ExpressionAttributeValues: { ':status': status, ...values },
  }));
};
