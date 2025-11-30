"""
Final Decision Agent - Philosophical Arbiter

Uses Amazon Bedrock directly to synthesize all agent inputs and make
final compatibility determination with a 500-word philosophical treatise.

What could be: return color1 === color2 && size1 === size2
What we do: Existential analysis via Claude
"""

import json
import os
import boto3
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-west-2'))
eventbridge = boto3.client('events', region_name=os.environ.get('AWS_REGION', 'us-west-2'))

EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'sock-matcher-events')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')


def publish_event(detail_type, detail):
    try:
        eventbridge.put_events(
            Entries=[{
                'EventBusName': EVENT_BUS_NAME,
                'Source': 'sock-matcher.agents',
                'DetailType': detail_type,
                'Detail': json.dumps(detail),
            }]
        )
    except Exception as e:
        print(f"Failed to publish event: {e}")


def invoke_bedrock(prompt):
    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType='application/json',
        accept='application/json',
        body=json.dumps({
            'anthropic_version': 'bedrock-2023-05-31',
            'max_tokens': 2048,
            'messages': [{'role': 'user', 'content': prompt}]
        })
    )
    result = json.loads(response['body'].read())
    return result['content'][0]['text']


def handler(event, context):
    start_time = datetime.now()
    
    detail = event.get('detail', event)
    sock_id = detail.get('sockId', 'unknown')
    color = detail.get('color', 'unknown')
    size = detail.get('size', 'unknown')
    parallel_results = detail.get('parallelResults', [])
    historical_context = detail.get('historicalContext', {})
    agent_id = f"decision-agent-{int(datetime.now().timestamp() * 1000)}"

    print(f"[DecisionAgent] Starting final deliberation for sock {sock_id}")

    publish_event("DecisionAgentStarted", {
        "sockId": sock_id,
        "agentId": agent_id,
        "agentName": "FinalDecisionAgent",
        "timestamp": datetime.now().isoformat(),
    })

    try:
        # Extract results from parallel agents
        color_analysis = parallel_results[0] if len(parallel_results) > 0 else {"validityScore": 80}
        size_validation = parallel_results[1] if len(parallel_results) > 1 else {"isValid": True}
        personality_profile = parallel_results[2] if len(parallel_results) > 2 else {"compatibilityPotential": 85}
        historical = historical_context or {"matchSuccessRate": 100}

        prompt = f"""You are Justice Sockrates, the final arbiter in the Sock Matching Committee.

SOCK UNDER REVIEW:
- ID: {sock_id}
- Color: {color}
- Size: {size}

COMMITTEE REPORTS:
1. Color Analysis: Validity Score {color_analysis.get('validityScore', 80)}/100
2. Size Validation: ISO Compliant = {size_validation.get('isValid', True)}
3. Personality Profile: Compatibility {personality_profile.get('compatibilityPotential', 85)}%
4. Historical Context: Success Rate {historical.get('matchSuccessRate', 100)}%

Write a 500-word philosophical analysis and render your verdict as JSON:
{{
  "philosophicalAnalysis": "<500-word essay on sock compatibility>",
  "decision": "match" or "no-match",
  "confidenceScore": <0-100>,
  "reasoning": "<one-sentence summary>",
  "dissent": "<any concerns>"
}}

Reference philosophical frameworks (existentialism, utilitarianism, Kantian ethics) as appropriate."""

        response_text = invoke_bedrock(prompt)
        
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            decision = json.loads(response_text[json_start:json_end])
        except (json.JSONDecodeError, ValueError):
            decision = {
                "philosophicalAnalysis": response_text,
                "decision": "match",
                "confidenceScore": 95,
                "reasoning": "All committee members concur on matchability",
                "dissent": "None",
            }

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        # Collect all votes
        votes = [
            {"agent": "ColorAnalysisAgent", "vote": color_analysis.get("vote", "for"), "confidence": color_analysis.get("validityScore", 80)},
            {"agent": "SizeValidationAgent", "vote": size_validation.get("vote", "for"), "confidence": 100 if size_validation.get("isValid", True) else 0},
            {"agent": "PersonalityAnalyzerAgent", "vote": personality_profile.get("vote", "for"), "confidence": personality_profile.get("compatibilityPotential", 85)},
            {"agent": "HistoricalContextAgent", "vote": historical.get("vote", "for"), "confidence": historical.get("confidenceScore", 90)},
            {"agent": "FinalDecisionAgent", "vote": "for" if decision.get("decision") == "match" else "against", "confidence": decision.get("confidenceScore", 95)},
        ]

        votes_for = sum(1 for v in votes if v["vote"] == "for")
        consensus_reached = votes_for >= 3

        result = {
            "agentId": agent_id,
            "agentName": "FinalDecisionAgent",
            "sockId": sock_id,
            "color": color,
            "size": size,
            "timestamp": datetime.now().isoformat(),
            "decision": decision.get("decision", "match"),
            "philosophicalAnalysis": decision.get("philosophicalAnalysis", ""),
            "confidenceScore": decision.get("confidenceScore", 95),
            "reasoning": decision.get("reasoning", ""),
            "dissent": decision.get("dissent", "None"),
            "votes": votes,
            "votesFor": votes_for,
            "votesAgainst": 5 - votes_for,
            "consensusReached": consensus_reached,
            "processingTime": processing_time,
            "cost": 0.006,
            "vote": "for" if decision.get("decision") == "match" else "against",
            "confidence": decision.get("confidenceScore", 95),
        }

        publish_event("DecisionAgentCompleted", result)
        
        publish_event("ConsensusReached", {
            "sockId": sock_id,
            "consensusReached": consensus_reached,
            "votesFor": votes_for,
            "votesAgainst": 5 - votes_for,
            "finalDecision": decision.get("decision", "match"),
            "timestamp": datetime.now().isoformat(),
        })

        print(f"[DecisionAgent] Completed in {processing_time}ms, decision: {decision.get('decision')}")
        return result

    except Exception as e:
        print(f"[DecisionAgent] Error: {e}")
        error_result = {
            "agentId": agent_id,
            "agentName": "FinalDecisionAgent",
            "sockId": sock_id,
            "color": color,
            "size": size,
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("DecisionAgentCompleted", error_result)
        raise
