/**
 * WebSocket $disconnect handler
 * Removes connection ID from DynamoDB
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

exports.handler = async (event) => {
  console.log('WebSocket disconnect:', JSON.stringify(event, null, 2));
  
  const connectionId = event.requestContext.connectionId;
  
  try {
    await docClient.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    }));
    
    console.log(`✅ Connection removed: ${connectionId}`);
    return { statusCode: 200, body: 'Disconnected' };
  } catch (error) {
    console.error('Failed to remove connection:', error);
    return { statusCode: 500, body: 'Failed to disconnect' };
  }
};
