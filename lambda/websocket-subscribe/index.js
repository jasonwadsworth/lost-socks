/**
 * WebSocket subscribe handler
 * Associates a connection with a sockId for targeted broadcasts
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  console.log('WebSocket subscribe:', JSON.stringify(event, null, 2));
  
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');
  const sockId = body.sockId;
  
  if (!sockId) {
    return { statusCode: 400, body: 'Missing sockId' };
  }
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
      UpdateExpression: 'SET sockId = :sockId, subscribedAt = :subscribedAt',
      ExpressionAttributeValues: {
        ':sockId': sockId,
        ':subscribedAt': new Date().toISOString(),
      },
    }));
    
    console.log(`✅ Connection ${connectionId} subscribed to sock ${sockId}`);
    return { statusCode: 200, body: JSON.stringify({ subscribed: sockId }) };
  } catch (error) {
    console.error('Failed to subscribe:', error);
    return { statusCode: 500, body: 'Failed to subscribe' };
  }
};
