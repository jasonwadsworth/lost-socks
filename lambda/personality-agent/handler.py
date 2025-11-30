"""
Personality Analyzer Agent - Sock Psychologist

Uses Strands Agents SDK to determine sock "personality" based on
color and size, including MBTI type, zodiac sign, and compatibility traits.

What could be: nothing, socks don't have personalities
What we do: Full psychological profile via AI agent with tools
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
def get_mbti_compatibility(mbti_type: str) -> str:
    """Get compatibility information for an MBTI type.
    
    Args:
        mbti_type: The 4-letter MBTI type (e.g., ENFP, ISTJ)
        
    Returns:
        Compatibility information for the MBTI type
    """
    compatibilities = {
        "ENFP": "Most compatible with INTJ, INFJ. The enthusiastic sock that brings joy.",
        "ISTJ": "Most compatible with ESTP, ESFP. The reliable, dependable sock.",
        "INFJ": "Most compatible with ENFP, ENTP. The intuitive, caring sock.",
        "ENTP": "Most compatible with INFJ, INTJ. The innovative, clever sock.",
        "INTJ": "Most compatible with ENFP, ENTP. The strategic, independent sock.",
        "ESFP": "Most compatible with ISTJ, ISFJ. The fun-loving, spontaneous sock.",
    }
    return compatibilities.get(mbti_type.upper(), "A unique personality type with broad compatibility.")


@tool  
def get_zodiac_traits(zodiac_sign: str) -> str:
    """Get personality traits for a zodiac sign.
    
    Args:
        zodiac_sign: The zodiac sign (e.g., Aries, Taurus)
        
    Returns:
        Personality traits associated with the zodiac sign
    """
    traits = {
        "aries": "Bold, ambitious, competitive. A sock that leads the drawer.",
        "taurus": "Reliable, patient, devoted. A sock that provides comfort.",
        "gemini": "Adaptable, curious, communicative. A sock for any occasion.",
        "cancer": "Intuitive, sentimental, protective. A nurturing sock.",
        "leo": "Dramatic, confident, dominant. A sock that demands attention.",
        "virgo": "Analytical, practical, loyal. A perfectly organized sock.",
        "libra": "Diplomatic, gracious, fair. A sock that pairs well with others.",
        "scorpio": "Passionate, stubborn, resourceful. An intense sock.",
        "sagittarius": "Adventurous, optimistic, honest. A sock for exploration.",
        "capricorn": "Disciplined, responsible, self-controlled. A professional sock.",
        "aquarius": "Progressive, original, independent. A unique sock.",
        "pisces": "Intuitive, artistic, gentle. A dreamy, soft sock.",
    }
    return traits.get(zodiac_sign.lower(), "A mysterious sock with hidden depths.")


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
    """Lambda handler for the Personality Analyzer Agent."""
    start_time = datetime.now()
    sock_id = event.get('sockId', 'unknown')
    color = event.get('color', 'unknown')
    size = event.get('size', 'unknown')
    agent_id = f"personality-agent-{int(datetime.now().timestamp() * 1000)}"

    print(f"[PersonalityAgent] Starting analysis for sock {sock_id}")

    publish_event("PersonalityAgentStarted", {
        "sockId": sock_id,
        "agentId": agent_id,
        "agentName": "PersonalityAnalyzerAgent",
        "timestamp": datetime.now().isoformat(),
    })

    try:
        model = BedrockModel(
            model_id=os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0'),
            region_name=os.environ.get('AWS_REGION', 'us-west-2'),
        )

        agent = Agent(
            model=model,
            tools=[get_mbti_compatibility, get_zodiac_traits],
            system_prompt="""You are a renowned sock psychologist with expertise in textile personality theory.
You have access to tools to look up MBTI compatibility and zodiac traits.

When analyzing a sock's personality, you must:
1. Determine the MBTI type based on color energy and size groundedness
2. Use get_mbti_compatibility to understand partnership potential
3. Determine the zodiac sign based on the sock's characteristics  
4. Use get_zodiac_traits to understand personality traits
5. Provide a compatibility potential score (0-100)

Always respond in JSON format:
{
  "mbtiType": "4-letter type",
  "zodiacSign": "sign name",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "musicGenre": "preferred genre",
  "idealPartner": "description",
  "compatibilityPotential": number,
  "personalitySummary": "50-word summary"
}"""
        )

        prompt = f"""Analyze the personality of a sock with these attributes:
- Color: {color}
- Size: {size}

Use your tools to look up MBTI compatibility and zodiac traits, then create 
a comprehensive personality profile. Be creative but commit fully to the analysis."""

        response = agent(prompt)
        response_text = str(response)

        try:
            json_match = response_text[response_text.find('{'):response_text.rfind('}')+1]
            profile = json.loads(json_match) if json_match else {}
        except (json.JSONDecodeError, ValueError):
            profile = {
                "mbtiType": "ENFP",
                "zodiacSign": "Sagittarius", 
                "traits": ["adventurous", "warm", "reliable", "cozy", "supportive"],
                "musicGenre": "Indie Folk",
                "idealPartner": "A sock of matching color with complementary energy",
                "compatibilityPotential": 85,
                "personalitySummary": response_text[:200],
            }

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        result = {
            "agentId": agent_id,
            "agentName": "PersonalityAnalyzerAgent",
            "sockId": sock_id,
            "timestamp": datetime.now().isoformat(),
            "mbtiType": profile.get("mbtiType", "ENFP"),
            "zodiacSign": profile.get("zodiacSign", "Sagittarius"),
            "traits": profile.get("traits", []),
            "musicGenre": profile.get("musicGenre", "Unknown"),
            "idealPartner": profile.get("idealPartner", ""),
            "compatibilityPotential": profile.get("compatibilityPotential", 85),
            "personalitySummary": profile.get("personalitySummary", ""),
            "processingTime": processing_time,
            "cost": 0.003,
            "vote": "for" if profile.get("compatibilityPotential", 85) > 50 else "against",
            "confidence": profile.get("compatibilityPotential", 85),
        }

        publish_event("PersonalityAgentCompleted", result)
        print(f"[PersonalityAgent] Completed in {processing_time}ms, MBTI: {result['mbtiType']}")
        return result

    except Exception as e:
        print(f"[PersonalityAgent] Error: {e}")
        error_result = {
            "agentId": agent_id,
            "agentName": "PersonalityAnalyzerAgent",
            "sockId": sock_id,
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("PersonalityAgentCompleted", error_result)
        raise
