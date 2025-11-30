/**
 * Event Logger - Audit Trail Obsessive
 * 
 * Logs ALL events to DynamoDB because we need a complete
 * audit trail of every single thing that happens.
 * 
 * What could be: console.log()
 * What we do: Persist every event to DynamoDB with TTL
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

export const handler = async (event) => {
  console.log("[EventLogger] Received event:", JSON.stringify(event, null, 2));

  const eventDetail = event.detail || event;
  const eventType = event["detail-type"] || eventDetail.eventType || "UnknownEvent";
  const timestamp = new Date().toISOString();
  const sockId = eventDetail.sockId || "unknown";

  // Store event in DynamoDB with 7-day TTL
  const ttl = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

  try {
    await dynamodb.send(new PutCommand({
      TableName: process.env.EVENT_STORE_TABLE,
      Item: {
        PK: `SOCK#${sockId}`,
        timestamp: `${timestamp}#${eventType}`,
        eventType,
        detail: eventDetail,
        source: event.source || "sock-matcher.agents",
        ttl,
        loggedAt: timestamp,
      },
    }));

    console.log(`[EventLogger] Stored event: ${eventType} for sock ${sockId}`);
    return { success: true, eventType, sockId };

  } catch (error) {
    console.error("[EventLogger] Failed to store event:", error);
    // Don't throw - we don't want logging failures to break the workflow
    return { success: false, error: error.message };
  }
};
