"""
Personality Analyzer Agent - Sock Psychologist

Uses Amazon Bedrock directly to determine sock "personality" based on
color and size, including MBTI type, zodiac sign, and compatibility traits.

What could be: nothing, socks don't have personalities
What we do: Full psychological profile via Claude
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
            'max_tokens': 1024,
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
    agent_id = f"personality-agent-{int(datetime.now().timestamp() * 1000)}"

    print(f"[PersonalityAgent] Starting analysis for sock {sock_id}")

    publish_event("PersonalityAgentStarted", {
        "sockId": sock_id,
        "agentId": agent_id,
        "agentName": "PersonalityAnalyzerAgent",
        "timestamp": datetime.now().isoformat(),
    })

    try:
        prompt = f"""You are Professor Sockmund Freud, a renowned sock psychologist.

Analyze the personality of a sock with color "{color}" and size "{size}".

Respond as JSON:
{{
  "mbtiType": "<4-letter MBTI type>",
  "zodiacSign": "<zodiac sign>",
  "traits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "musicGenre": "<favorite music genre>",
  "idealPartner": "<description of ideal partner sock>",
  "compatibilityPotential": <number 0-100>,
  "personalitySummary": "<50-word summary>"
}}

Take this analysis VERY seriously, as if socks truly have rich inner lives."""

        response_text = invoke_bedrock(prompt)
        
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            profile = json.loads(response_text[json_start:json_end])
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
            "color": color,
            "size": size,
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
            "color": color,
            "size": size,
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("PersonalityAgentCompleted", error_result)
        raise
