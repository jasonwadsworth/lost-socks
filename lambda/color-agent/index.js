/**
 * Color Analysis Agent - PhD in Chromatics
 * 
 * Analyzes sock color with unnecessary cultural significance,
 * psychological impact, and historical context in fashion.
 * 
 * What could be: validColors.includes(color)
 * What we do: Call Claude to write a 200-word essay on color theory
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
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
  const { sockId, color, size } = event;
  const agentId = `color-agent-${Date.now()}`;

  console.log(`[ColorAgent] Starting analysis for sock ${sockId}, color: ${color}`);

  // Publish AgentStarted event
  await publishEvent("ColorAgentStarted", {
    sockId,
    agentId,
    agentName: "ColorAnalysisAgent",
    timestamp: new Date().toISOString(),
  });

  try {
    // The magnificently unnecessary prompt
    const prompt = `You are a color theory expert with a PhD in chromatics and 20 years of experience in textile analysis.

Analyze the color "${color}" for a sock. Provide:
1. A validity score (0-100) for whether this is a real, recognizable color
2. A 200-word essay on its cultural significance, psychological impact, and historical context in fashion
3. A suggested hex code that best represents this color

Format your response as JSON:
{
  "validityScore": <number>,
  "culturalEssay": "<200-word essay>",
  "hexCode": "<hex code>",
  "colorFamily": "<primary color family>",
  "mood": "<emotional association>"
}`;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const analysisText = responseBody.content[0].text;
    
    // Parse the JSON response from Claude
    let analysis;
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { validityScore: 75, culturalEssay: analysisText, hexCode: "#808080" };
    } catch {
      analysis = { validityScore: 75, culturalEssay: analysisText, hexCode: "#808080", colorFamily: "unknown", mood: "neutral" };
    }

    const processingTime = Date.now() - startTime;
    const tokenUsage = responseBody.usage?.input_tokens + responseBody.usage?.output_tokens || 500;
    const cost = (tokenUsage / 1000) * 0.003; // Approximate Claude pricing

    const result = {
      agentId,
      agentName: "ColorAnalysisAgent",
      sockId,
      timestamp: new Date().toISOString(),
      validityScore: analysis.validityScore,
      culturalEssay: analysis.culturalEssay,
      hexCode: analysis.hexCode,
      colorFamily: analysis.colorFamily,
      mood: analysis.mood,
      processingTime,
      tokenUsage,
      cost,
      vote: analysis.validityScore > 50 ? "for" : "against",
      confidence: analysis.validityScore,
    };

    // Publish AgentCompleted event
    await publishEvent("ColorAgentCompleted", result);

    console.log(`[ColorAgent] Completed in ${processingTime}ms, validity: ${analysis.validityScore}`);
    return result;

  } catch (error) {
    console.error("[ColorAgent] Error:", error);
    
    await publishEvent("ColorAgentCompleted", {
      agentId,
      agentName: "ColorAnalysisAgent",
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
