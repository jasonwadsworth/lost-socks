/**
 * WebSocket broadcast handler
 * Triggered by EventBridge to broadcast agent events to subscribed clients
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const WEBSOCKET_ENDPOINT = process.env.WEBSOCKET_ENDPOINT;

exports.handler = async (event) => {
  console.log('WebSocket broadcast event:', JSON.stringify(event, null, 2));
  
  // Handle EventBridge event
  const detail = event.detail || event;
  const sockId = detail.sockId;
  const eventType = event['detail-type'] || detail.eventType || 'agent:progress';
  
  if (!sockId) {
    console.log('No sockId in event, skipping broadcast');
    return { statusCode: 200, body: 'No sockId' };
  }
  
  // Create API Gateway Management API client
  const apiClient = new ApiGatewayManagementApiClient({
    endpoint: WEBSOCKET_ENDPOINT,
  });
  
  try {
    // Query connections subscribed to this sockId
    const result = await docClient.send(new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'SockIdIndex',
      KeyConditionExpression: 'sockId = :sockId',
      ExpressionAttributeValues: {
        ':sockId': sockId,
      },
    }));
    
    const connections = result.Items || [];
    console.log(`Found ${connections.length} connections for sock ${sockId}`);
    
    // Map EventBridge event type to WebSocket event
    const wsEventType = mapEventType(eventType);
    
    // Broadcast to all subscribed connections
    const broadcastPromises = connections.map(async (conn) => {
      try {
        await apiClient.send(new PostToConnectionCommand({
          ConnectionId: conn.connectionId,
          Data: JSON.stringify({
            type: wsEventType,
            data: detail,
            timestamp: new Date().toISOString(),
          }),
        }));
        console.log(`✅ Sent to ${conn.connectionId}`);
      } catch (error) {
        if (error.statusCode === 410) {
          // Connection is stale, remove it
          console.log(`Removing stale connection: ${conn.connectionId}`);
          await docClient.send(new DeleteCommand({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId: conn.connectionId },
          }));
        } else {
          console.error(`Failed to send to ${conn.connectionId}:`, error);
        }
      }
    });
    
    await Promise.all(broadcastPromises);
    
    return { statusCode: 200, body: `Broadcast to ${connections.length} connections` };
  } catch (error) {
    console.error('Broadcast failed:', error);
    return { statusCode: 500, body: 'Broadcast failed' };
  }
};

function mapEventType(eventBridgeType) {
  const mapping = {
    'ColorAgentStarted': 'agent:started',
    'ColorAgentCompleted': 'agent:completed',
    'SizeAgentStarted': 'agent:started',
    'SizeAgentCompleted': 'agent:completed',
    'PersonalityAgentStarted': 'agent:started',
    'PersonalityAgentCompleted': 'agent:completed',
    'HistoricalAgentStarted': 'agent:started',
    'HistoricalAgentCompleted': 'agent:completed',
    'DecisionAgentStarted': 'agent:started',
    'DecisionAgentCompleted': 'agent:completed',
    'AgentStarted': 'agent:started',
    'AgentProgress': 'agent:progress',
    'AgentCompleted': 'agent:completed',
    'ConsensusReached': 'workflow:complete',
    'WorkflowCompleted': 'workflow:complete',
    'MatchFound': 'match:found',
  };
  return mapping[eventBridgeType] || 'agent:progress';
}
