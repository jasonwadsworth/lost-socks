/**
 * Match Search Handler - The Actual Useful Part
 * 
 * Triggered after ConsensusReached event to find matching socks.
 * This is the only part that actually does something useful,
 * but we've wrapped it in 20+ events to get here.
 * 
 * What could be: SELECT * FROM socks WHERE color = ? AND size = ?
 * What we do: The same thing, but after 30 seconds of AI deliberation
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION });

const publishEvent = async (detailType, detail) => {
  await eventBridge.send(new PutEventsCommand({
    Entries: [{
      EventBusName: process.env.EVENT_BUS_NAME,
      Source: "sock-matcher.agents",
      DetailType: detailType,
      Detail: JSON.stringify(detail),
    }],
  }));
};

export const handler = async (event) => {
  const startTime = Date.now();
  
  // Extract sock info from the workflow state (handle EventBridge structure)
  const detail = event.detail || event;
  const { sockId, color, size, finalDecision } = detail;
  
  console.log(`[MatchSearch] Searching for matches for sock ${sockId}`);

  // Publish MatchSearchStarted event
  await publishEvent("MatchSearchStarted", {
    sockId,
    color,
    size,
    timestamp: new Date().toISOString(),
  });

  try {
    // Query for matching socks using GSI
    const result = await dynamodb.send(new QueryCommand({
      TableName: process.env.SOCKS_TABLE,
      IndexName: "ColorSizeIndex",
      KeyConditionExpression: "color = :color AND size = :size",
      ExpressionAttributeValues: {
        ":color": color,
        ":size": size,
      },
    }));

    const allMatches = result.Items || [];
    
    // Filter out the original sock
    const matches = allMatches.filter(sock => sock.PK !== `SOCK#${sockId}`);

    const processingTime = Date.now() - startTime;

    if (matches.length > 0) {
      // Publish MatchFound event for each match
      for (const match of matches) {
        await publishEvent("MatchFound", {
          sockId,
          matchedSockId: match.PK.replace("SOCK#", ""),
          color,
          size,
          compatibilityScore: 100, // Always 100 because color + size match
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // Publish NoMatchFound event
      await publishEvent("NoMatchFound", {
        sockId,
        color,
        size,
        reason: "No socks with matching color and size found in the database",
        timestamp: new Date().toISOString(),
      });
    }

    // Update the original sock with match results
    try {
      await dynamodb.send(new UpdateCommand({
        TableName: process.env.SOCKS_TABLE,
        Key: {
          PK: `SOCK#${sockId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET matchCount = :count, matchSearchedAt = :timestamp, #status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":count": matches.length,
          ":timestamp": new Date().toISOString(),
          ":status": "complete",
        },
      }));
    } catch (updateError) {
      console.log("[MatchSearch] Failed to update sock status:", updateError.message);
    }

    // Publish WorkflowCompleted event
    await publishEvent("WorkflowCompleted", {
      sockId,
      matchesFound: matches.length,
      totalProcessingTime: processingTime,
      timestamp: new Date().toISOString(),
    });

    const response = {
      sockId,
      matchesFound: matches.length,
      matches: matches.map(m => ({
        id: m.PK.replace("SOCK#", ""),
        color: m.color,
        size: m.size,
        compatibilityScore: 100,
      })),
      processingTime,
      cost: 0.0001,
    };

    console.log(`[MatchSearch] Found ${matches.length} matches in ${processingTime}ms`);
    return response;

  } catch (error) {
    console.error("[MatchSearch] Error:", error);

    await publishEvent("WorkflowFailed", {
      sockId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
};
