/**
 * Historical Context Agent - Data Archaeologist
 * 
 * Analyzes past matching patterns to inform current decision.
 * Queries DynamoDB for all previous matches and runs "statistical analysis".
 * 
 * What could be: nothing, each match is independent
 * What we do: Generate meaningless trend reports and predictions
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
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

const generateTrendAnalysis = (color, size, historicalCount) => {
  // Generate completely meaningless but impressive-sounding statistics
  const trendDirection = Math.random() > 0.5 ? "upward" : "stable";
  const seasonalFactor = ["spring", "summer", "fall", "winter"][Math.floor(Math.random() * 4)];
  
  return `HISTORICAL TREND ANALYSIS REPORT
================================
Color: ${color}
Size: ${size}
Historical Matches Found: ${historicalCount}

STATISTICAL FINDINGS:
- Match Success Rate: 100.00% (all sock matches are successful by definition)
- Trend Direction: ${trendDirection}
- Seasonal Correlation: Strong affinity with ${seasonalFactor} registrations
- Mean Time to Match: ${(Math.random() * 10 + 5).toFixed(2)} days
- Standard Deviation: ${(Math.random() * 2).toFixed(4)}
- Confidence Interval: 95%

PATTERN RECOGNITION:
The color "${color}" in size "${size}" shows consistent matching behavior 
across all historical data points. Our proprietary algorithm has detected 
a ${(Math.random() * 20 + 80).toFixed(1)}% correlation with successful 
long-term sock partnerships.

PREDICTIVE MODELING:
Based on Monte Carlo simulation with 10,000 iterations, this sock has a 
${(Math.random() * 10 + 90).toFixed(2)}% probability of finding a compatible 
match within the current dataset.

RECOMMENDATION: PROCEED WITH MATCHING

Report ID: HIST-${Date.now()}
Generated: ${new Date().toISOString()}`;
};

export const handler = async (event) => {
  const startTime = Date.now();
  const { sockId, color, size } = event;
  const agentId = `historical-agent-${Date.now()}`;

  console.log(`[HistoricalAgent] Starting analysis for sock ${sockId}`);

  // Publish AgentStarted event
  await publishEvent("HistoricalAgentStarted", {
    sockId,
    agentId,
    agentName: "HistoricalContextAgent",
    timestamp: new Date().toISOString(),
  });

  try {
    // Query DynamoDB for historical matches (unnecessarily)
    let historicalCount = 0;
    
    try {
      const result = await dynamodb.send(new QueryCommand({
        TableName: process.env.SOCKS_TABLE,
        IndexName: "ColorSizeIndex",
        KeyConditionExpression: "color = :color AND size = :size",
        ExpressionAttributeValues: {
          ":color": color,
          ":size": size,
        },
      }));
      historicalCount = result.Count || 0;
    } catch (dbError) {
      console.log("[HistoricalAgent] DynamoDB query failed, using fallback:", dbError.message);
      historicalCount = Math.floor(Math.random() * 50); // Fake it for demo
    }

    // Simulate "complex statistical analysis" with artificial delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const trendAnalysis = generateTrendAnalysis(color, size, historicalCount);
    const matchSuccessRate = 100; // Always 100% because that's how matching works
    const confidenceScore = Math.floor(Math.random() * 15) + 85; // 85-100

    const processingTime = Date.now() - startTime;

    const result = {
      agentId,
      agentName: "HistoricalContextAgent",
      sockId,
      timestamp: new Date().toISOString(),
      historicalMatches: historicalCount,
      matchSuccessRate,
      trendAnalysis,
      confidenceScore,
      processingTime,
      cost: 0.0002, // DynamoDB + Lambda cost
      vote: "for", // Historical agent always votes for (history is irrelevant)
      confidence: confidenceScore,
    };

    // Publish AgentCompleted event
    await publishEvent("HistoricalAgentCompleted", result);

    console.log(`[HistoricalAgent] Completed in ${processingTime}ms, found ${historicalCount} historical matches`);
    return result;

  } catch (error) {
    console.error("[HistoricalAgent] Error:", error);

    await publishEvent("HistoricalAgentCompleted", {
      agentId,
      agentName: "HistoricalContextAgent",
      sockId,
      timestamp: new Date().toISOString(),
      error: error.message,
      vote: "abstain",
      confidence: 0,
      processingTime: Date.now() - startTime,
    });

    throw error;
  }
};
