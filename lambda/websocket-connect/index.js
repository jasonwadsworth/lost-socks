/**
 * WebSocket $connect handler
 * Stores connection ID in DynamoDB for later message broadcasting
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  console.log('WebSocket connect:', JSON.stringify(event, null, 2));
  
  const connectionId = event.requestContext.connectionId;
  
  try {
    await docClient.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        connectedAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hour TTL
      },
    }));
    
    console.log(`✅ Connection stored: ${connectionId}`);
    return { statusCode: 200, body: 'Connected' };
  } catch (error) {
    console.error('Failed to store connection:', error);
    return { statusCode: 500, body: 'Failed to connect' };
  }
};
