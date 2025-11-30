/**
 * Personality Analyzer Agent - Sock Psychologist
 * 
 * Determines sock "personality" based on color and size,
 * including MBTI type, zodiac sign, and compatibility traits.
 * 
 * What could be: nothing, socks don't have personalities
 * What we do: Full psychological profile via Claude
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
  const agentId = `personality-agent-${Date.now()}`;

  console.log(`[PersonalityAgent] Starting analysis for sock ${sockId}`);

  // Publish AgentStarted event
  await publishEvent("PersonalityAgentStarted", {
    sockId,
    agentId,
    agentName: "PersonalityAnalyzerAgent",
    timestamp: new Date().toISOString(),
  });

  try {
    // The gloriously absurd prompt
    const prompt = `You are a renowned sock psychologist with expertise in textile personality theory.

Based on this sock's attributes:
- Color: ${color}
- Size: ${size}

Create a detailed personality profile for this sock. Include:
1. Myers-Briggs Type Indicator (MBTI) - which of the 16 types best fits this sock?
2. Zodiac sign - based on the color's energy and size's groundedness
3. Top 5 personality traits
4. Favorite music genre
5. Ideal partner sock characteristics
6. Compatibility score potential (0-100)
7. A brief personality summary (50 words)

Be creative but commit fully to the analysis as if socks truly have personalities.

Format as JSON:
{
  "mbtiType": "<4-letter type>",
  "zodiacSign": "<sign>",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "musicGenre": "<genre>",
  "idealPartner": "<description>",
  "compatibilityPotential": <number>,
  "personalitySummary": "<50-word summary>"
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

    // Parse the JSON response
    let profile;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      profile = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      profile = {
        mbtiType: "ENFP",
        zodiacSign: "Sagittarius",
        traits: ["adventurous", "warm", "reliable", "cozy", "supportive"],
        musicGenre: "Indie Folk",
        idealPartner: "A sock of matching color with complementary energy",
        compatibilityPotential: 85,
        personalitySummary: analysisText.substring(0, 200),
      };
    }

    const processingTime = Date.now() - startTime;
    const tokenUsage = responseBody.usage?.input_tokens + responseBody.usage?.output_tokens || 600;
    const cost = (tokenUsage / 1000) * 0.003;

    const result = {
      agentId,
      agentName: "PersonalityAnalyzerAgent",
      sockId,
      timestamp: new Date().toISOString(),
      mbtiType: profile.mbtiType,
      zodiacSign: profile.zodiacSign,
      traits: profile.traits,
      musicGenre: profile.musicGenre,
      idealPartner: profile.idealPartner,
      compatibilityPotential: profile.compatibilityPotential,
      personalitySummary: profile.personalitySummary,
      processingTime,
      tokenUsage,
      cost,
      vote: profile.compatibilityPotential > 50 ? "for" : "against",
      confidence: profile.compatibilityPotential,
    };

    // Publish AgentCompleted event
    await publishEvent("PersonalityAgentCompleted", result);

    console.log(`[PersonalityAgent] Completed in ${processingTime}ms, MBTI: ${profile.mbtiType}`);
    return result;

  } catch (error) {
    console.error("[PersonalityAgent] Error:", error);

    await publishEvent("PersonalityAgentCompleted", {
      agentId,
      agentName: "PersonalityAnalyzerAgent",
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
