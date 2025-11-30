"""
Color Analysis Agent - PhD in Chromatics

Uses Amazon Bedrock directly to analyze sock color with unnecessary
cultural significance, psychological impact, and historical context.

What could be: validColors.includes(color)
What we do: Call Claude to write essays on color theory
"""

import json
import os
import boto3
from datetime import datetime

# AWS clients
bedrock = boto3.client('bedrock-runtime', region_name=os.environ.get('AWS_REGION', 'us-west-2'))
eventbridge = boto3.client('events', region_name=os.environ.get('AWS_REGION', 'us-west-2'))

EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'sock-matcher-events')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0')


def publish_event(detail_type, detail):
    """Publish an event to EventBridge."""
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
    """Invoke Bedrock Claude model."""
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
    """Lambda handler for the Color Analysis Agent."""
    start_time = datetime.now()
    
    # Extract sock info from event (could be from Step Functions or EventBridge)
    detail = event.get('detail', event)
    sock_id = detail.get('sockId', 'unknown')
    color = detail.get('color', 'unknown')
    size = detail.get('size', 'unknown')
    agent_id = f"color-agent-{int(datetime.now().timestamp() * 1000)}"

    print(f"[ColorAgent] Starting analysis for sock {sock_id}, color: {color}")

    # Publish AgentStarted event
    publish_event("ColorAgentStarted", {
        "sockId": sock_id,
        "agentId": agent_id,
        "agentName": "ColorAnalysisAgent",
        "timestamp": datetime.now().isoformat(),
    })

    try:
        # The magnificently unnecessary prompt
        prompt = f"""You are Dr. Chromatius, a color theory expert with a PhD in chromatics.

Analyze the color "{color}" for a sock. Provide your response as JSON:
{{
  "validityScore": <number 0-100>,
  "culturalEssay": "<200-word essay on cultural significance>",
  "hexCode": "<hex code>",
  "colorFamily": "<primary color family>",
  "mood": "<emotional association>"
}}

Be thorough and take this analysis VERY seriously."""

        response_text = invoke_bedrock(prompt)
        
        # Parse JSON from response
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            analysis = json.loads(response_text[json_start:json_end])
        except (json.JSONDecodeError, ValueError):
            analysis = {
                "validityScore": 85,
                "culturalEssay": response_text[:500],
                "hexCode": "#808080",
                "colorFamily": "unknown",
                "mood": "neutral"
            }

        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        result = {
            "agentId": agent_id,
            "agentName": "ColorAnalysisAgent",
            "sockId": sock_id,
            "color": color,
            "size": size,
            "timestamp": datetime.now().isoformat(),
            "validityScore": analysis.get("validityScore", 85),
            "culturalEssay": analysis.get("culturalEssay", ""),
            "hexCode": analysis.get("hexCode", "#808080"),
            "colorFamily": analysis.get("colorFamily", "unknown"),
            "mood": analysis.get("mood", "neutral"),
            "processingTime": processing_time,
            "cost": 0.003,
            "vote": "for" if analysis.get("validityScore", 85) > 50 else "against",
            "confidence": analysis.get("validityScore", 85),
        }

        # Publish AgentCompleted event
        publish_event("ColorAgentCompleted", result)

        print(f"[ColorAgent] Completed in {processing_time}ms")
        return result

    except Exception as e:
        print(f"[ColorAgent] Error: {e}")
        error_result = {
            "agentId": agent_id,
            "agentName": "ColorAnalysisAgent",
            "sockId": sock_id,
            "color": color,
            "size": size,
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("ColorAgentCompleted", error_result)
        raise
