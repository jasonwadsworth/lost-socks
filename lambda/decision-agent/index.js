/**
 * Final Decision Agent - Philosophical Arbiter
 * 
 * Synthesizes all agent inputs and makes final compatibility determination.
 * Writes a 500-word philosophical treatise on sock compatibility.
 * 
 * What could be: return color1 === color2 && size1 === size2
 * What we do: 4000-token context window, existential analysis
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
  const { sockId, color, size, parallelResults, historicalContext } = event;
  const agentId = `decision-agent-${Date.now()}`;

  console.log(`[DecisionAgent] Starting final deliberation for sock ${sockId}`);

  // Publish AgentStarted event
  await publishEvent("DecisionAgentStarted", {
    sockId,
    agentId,
    agentName: "FinalDecisionAgent",
    timestamp: new Date().toISOString(),
  });

  try {
    // Extract results from parallel agents
    const colorAnalysis = parallelResults?.[0] || { validityScore: 80, culturalEssay: "Color analysis pending" };
    const sizeValidation = parallelResults?.[1] || { isValid: true, complianceReport: "Size validation pending" };
    const personalityProfile = parallelResults?.[2] || { mbtiType: "ENFP", personalitySummary: "Personality analysis pending" };
    const historical = historicalContext || { matchSuccessRate: 100, trendAnalysis: "Historical analysis pending" };

    // The magnificently over-the-top prompt
    const prompt = `You are the final arbiter in a prestigious Sock Matching Committee. Your role is to synthesize the analyses from your fellow committee members and render a final verdict on this sock's matchability.

SOCK UNDER REVIEW:
- ID: ${sockId}
- Color: ${color}
- Size: ${size}

COMMITTEE REPORTS:

1. COLOR ANALYSIS AGENT REPORT:
Validity Score: ${colorAnalysis.validityScore}/100
Cultural Essay: ${colorAnalysis.culturalEssay}

2. SIZE VALIDATION AGENT REPORT:
ISO Compliant: ${sizeValidation.isValid}
Compliance Report: ${sizeValidation.complianceReport?.substring(0, 500) || "Compliant"}

3. PERSONALITY ANALYZER AGENT REPORT:
MBTI Type: ${personalityProfile.mbtiType}
Summary: ${personalityProfile.personalitySummary}

4. HISTORICAL CONTEXT AGENT REPORT:
Match Success Rate: ${historical.matchSuccessRate}%
Trend Analysis: ${historical.trendAnalysis?.substring(0, 500) || "Positive trends"}

YOUR TASK:
Write a comprehensive 500-word philosophical analysis addressing:
1. The existential nature of sock pairing and what it means for this particular sock
2. How the committee's findings inform your decision
3. The practical implications of approving or denying this sock's entry into the matching pool
4. A final recommendation with confidence score

Be thoughtful, thorough, and slightly dramatic. This is an important decision.

Format your response as JSON:
{
  "philosophicalAnalysis": "<500-word essay>",
  "decision": "match" or "no-match",
  "confidenceScore": <0-100>,
  "reasoning": "<one-sentence summary>",
  "dissent": "<any concerns or minority opinions>"
}`;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const analysisText = responseBody.content[0].text;

    // Parse the JSON response
    let decision;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      decision = {
        philosophicalAnalysis: analysisText,
        decision: "match",
        confidenceScore: 95,
        reasoning: "All committee members concur on matchability",
        dissent: "None",
      };
    }

    const processingTime = Date.now() - startTime;
    const tokenUsage = responseBody.usage?.input_tokens + responseBody.usage?.output_tokens || 1500;
    const cost = (tokenUsage / 1000) * 0.003;

    // Collect all votes
    const votes = [
      { agent: "ColorAnalysisAgent", vote: colorAnalysis.vote || "for", confidence: colorAnalysis.validityScore || 80 },
      { agent: "SizeValidationAgent", vote: sizeValidation.vote || "for", confidence: sizeValidation.isValid ? 100 : 0 },
      { agent: "PersonalityAnalyzerAgent", vote: personalityProfile.vote || "for", confidence: personalityProfile.compatibilityPotential || 85 },
      { agent: "HistoricalContextAgent", vote: historical.vote || "for", confidence: historical.confidenceScore || 90 },
      { agent: "FinalDecisionAgent", vote: decision.decision === "match" ? "for" : "against", confidence: decision.confidenceScore },
    ];

    const votesFor = votes.filter(v => v.vote === "for").length;
    const consensusReached = votesFor >= 3;

    const result = {
      agentId,
      agentName: "FinalDecisionAgent",
      sockId,
      timestamp: new Date().toISOString(),
      decision: decision.decision,
      philosophicalAnalysis: decision.philosophicalAnalysis,
      confidenceScore: decision.confidenceScore,
      reasoning: decision.reasoning,
      dissent: decision.dissent,
      votes,
      votesFor,
      votesAgainst: 5 - votesFor,
      consensusReached,
      processingTime,
      tokenUsage,
      cost,
      vote: decision.decision === "match" ? "for" : "against",
      confidence: decision.confidenceScore,
    };

    // Publish AgentCompleted event
    await publishEvent("DecisionAgentCompleted", result);

    // Publish ConsensusReached event
    await publishEvent("ConsensusReached", {
      sockId,
      consensusReached,
      votesFor,
      votesAgainst: 5 - votesFor,
      finalDecision: decision.decision,
      timestamp: new Date().toISOString(),
    });

    console.log(`[DecisionAgent] Completed in ${processingTime}ms, decision: ${decision.decision}, consensus: ${consensusReached}`);
    return result;

  } catch (error) {
    console.error("[DecisionAgent] Error:", error);

    await publishEvent("DecisionAgentCompleted", {
      agentId,
      agentName: "FinalDecisionAgent",
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
