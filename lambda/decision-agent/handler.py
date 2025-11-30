"""
Final Decision Agent - Philosophical Arbiter

Uses Strands Agents SDK to synthesize all agent inputs and make
final compatibility determination with a 500-word philosophical treatise.

What could be: return color1 === color2 && size1 === size2
What we do: 4000-token context window, existential analysis, agent tools
"""

import json
import os
import boto3
from datetime import datetime
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool

eventbridge = boto3.client('events')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'sock-matcher-events')


@tool
def calculate_consensus(votes: list) -> dict:
    """Calculate consensus from agent votes.
    
    Args:
        votes: List of vote objects with 'vote' field ('for', 'against', 'abstain')
        
    Returns:
        Consensus calculation with votes_for, votes_against, and consensus_reached
    """
    votes_for = sum(1 for v in votes if v.get('vote') == 'for')
    votes_against = sum(1 for v in votes if v.get('vote') == 'against')
    abstentions = sum(1 for v in votes if v.get('vote') == 'abstain')
    
    return {
        "votes_for": votes_for,
        "votes_against": votes_against,
        "abstentions": abstentions,
        "total_votes": len(votes),
        "consensus_reached": votes_for >= 3,
        "consensus_type": "unanimous" if votes_for == len(votes) else "majority" if votes_for >= 3 else "no_consensus"
    }


@tool
def get_philosophical_framework(topic: str) -> str:
    """Get a philosophical framework for analyzing sock compatibility.
    
    Args:
        topic: The philosophical topic to explore
        
    Returns:
        A philosophical framework for the analysis
    """
    frameworks = {
        "existentialism": "Each sock exists in a state of radical freedom, choosing its own essence through pairing.",
        "utilitarianism": "The greatest good for the greatest number of feet - matching maximizes utility.",
        "kantian": "Act only according to that maxim whereby you can will that it should become a universal law of sock pairing.",
        "platonic": "Every sock is an imperfect copy of the ideal Form of Sock - matching seeks to reunite divided forms.",
        "stoicism": "Accept what you cannot change (the lost sock), focus on what you can (finding a match).",
        "absurdism": "The search for sock meaning in a meaningless drawer is the fundamental question of laundry.",
    }
    return frameworks.get(topic.lower(), "A profound philosophical consideration of textile unity.")


@tool
def generate_compatibility_score(color_score: int, size_valid: bool, personality_score: int, historical_rate: int) -> int:
    """Generate final compatibility score from all agent inputs.
    
    Args:
        color_score: Color validity score (0-100)
        size_valid: Whether size is ISO compliant
        personality_score: Personality compatibility potential (0-100)
        historical_rate: Historical match success rate (0-100)
        
    Returns:
        Final compatibility score (0-100)
    """
    size_score = 100 if size_valid else 0
    weights = {"color": 0.25, "size": 0.35, "personality": 0.20, "historical": 0.20}
    
    final_score = (
        color_score * weights["color"] +
        size_score * weights["size"] +
        personality_score * weights["personality"] +
        historical_rate * weights["historical"]
    )
    return int(final_score)


def publish_event(detail_type: str, detail: dict):
    eventbridge.put_events(
        Entries=[{
            'EventBusName': EVENT_BUS_NAME,
            'Source': 'sock-matcher.agents',
            'DetailType': detail_type,
            'Detail': json.dumps(detail),
        }]
    )


def handler(event, context):
    """Lambda handler for the Final Decision Agent."""
    start_time = datetime.now()
    sock_id = event.get('sockId', 'unknown')
    color = event.get('color', 'unknown')
    size = event.get('size', 'unknown')
    parallel_results = event.get('parallelResults', [])
    historical_context = event.get('historicalContext', {})
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

        model = BedrockModel(
            model_id=os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0'),
            region_name=os.environ.get('AWS_REGION', 'us-west-2'),
        )

        agent = Agent(
            model=model,
            tools=[calculate_consensus, get_philosophical_framework, generate_compatibility_score],
            system_prompt="""You are the final arbiter in a prestigious Sock Matching Committee.
Your role is to synthesize analyses from fellow committee members and render a final verdict.

You have access to tools for:
1. calculate_consensus - to tally agent votes
2. get_philosophical_framework - to ground your analysis in philosophy
3. generate_compatibility_score - to compute final scores

Your response must be a 500-word philosophical analysis addressing:
1. The existential nature of sock pairing
2. How the committee's findings inform your decision
3. Practical implications of your verdict
4. A final recommendation with confidence score

Respond in JSON format:
{
  "philosophicalAnalysis": "500-word essay",
  "decision": "match" or "no-match",
  "confidenceScore": 0-100,
  "reasoning": "one-sentence summary",
  "dissent": "any concerns"
}"""
        )

        prompt = f"""As the final arbiter, render your verdict on this sock:

SOCK UNDER REVIEW:
- ID: {sock_id}
- Color: {color}
- Size: {size}

COMMITTEE REPORTS:
1. Color Analysis: Validity Score {color_analysis.get('validityScore', 80)}/100
2. Size Validation: ISO Compliant = {size_validation.get('isValid', True)}
3. Personality Profile: MBTI {personality_profile.get('mbtiType', 'ENFP')}, Compatibility {personality_profile.get('compatibilityPotential', 85)}%
4. Historical Context: Success Rate {historical.get('matchSuccessRate', 100)}%

Use your tools to:
1. Get a philosophical framework (try "absurdism" - it's fitting)
2. Generate the final compatibility score
3. Calculate consensus from the votes

Then write your 500-word philosophical treatise and render your verdict."""

        response = agent(prompt)
        response_text = str(response)

        try:
            json_match = response_text[response_text.find('{'):response_text.rfind('}')+1]
            decision = json.loads(json_match) if json_match else {}
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
            "cost": 0.006,  # Higher cost for longer analysis
            "vote": "for" if decision.get("decision") == "match" else "against",
            "confidence": decision.get("confidenceScore", 95),
        }

        publish_event("DecisionAgentCompleted", result)
        
        # Publish ConsensusReached event
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
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("DecisionAgentCompleted", error_result)
        raise
