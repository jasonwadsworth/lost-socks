"""
Color Analysis Agent - PhD in Chromatics

Uses Strands Agents SDK to analyze sock color with unnecessary
cultural significance, psychological impact, and historical context.

What could be: validColors.includes(color)
What we do: Spawn an AI agent with tools to write essays on color theory
"""

import json
import os
import boto3
from datetime import datetime
from strands import Agent
from strands.models import BedrockModel
from strands.tools import tool

# EventBridge client for publishing events
eventbridge = boto3.client('events')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'sock-matcher-events')


@tool
def get_color_hex_code(color_name: str) -> str:
    """Look up the hex code for a given color name.
    
    Args:
        color_name: The name of the color to look up
        
    Returns:
        The hex code for the color, or a default gray if not found
    """
    # A magnificently over-engineered color lookup
    color_map = {
        "red": "#FF0000", "blue": "#0000FF", "green": "#00FF00",
        "yellow": "#FFFF00", "orange": "#FFA500", "purple": "#800080",
        "pink": "#FFC0CB", "black": "#000000", "white": "#FFFFFF",
        "gray": "#808080", "grey": "#808080", "brown": "#A52A2A",
        "navy": "#000080", "teal": "#008080", "maroon": "#800000",
    }
    return color_map.get(color_name.lower(), "#808080")


@tool
def analyze_color_psychology(color_name: str) -> str:
    """Analyze the psychological impact of a color.
    
    Args:
        color_name: The name of the color to analyze
        
    Returns:
        A psychological analysis of the color
    """
    # Completely unnecessary psychological analysis
    psychology = {
        "red": "Associated with passion, energy, and urgency. May increase heart rate.",
        "blue": "Evokes calm, trust, and stability. Often used in corporate settings.",
        "green": "Represents nature, growth, and harmony. Easy on the eyes.",
        "yellow": "Stimulates happiness and optimism. Can cause eye fatigue.",
        "black": "Symbolizes elegance, power, and mystery. Slimming effect.",
        "white": "Represents purity, cleanliness, and simplicity. Reflects light.",
    }
    return psychology.get(color_name.lower(), "A unique color with complex psychological implications.")


def publish_event(detail_type: str, detail: dict):
    """Publish an event to EventBridge."""
    eventbridge.put_events(
        Entries=[{
            'EventBusName': EVENT_BUS_NAME,
            'Source': 'sock-matcher.agents',
            'DetailType': detail_type,
            'Detail': json.dumps(detail),
        }]
    )


def handler(event, context):
    """Lambda handler for the Color Analysis Agent."""
    start_time = datetime.now()
    sock_id = event.get('sockId', 'unknown')
    color = event.get('color', 'unknown')
    size = event.get('size', 'unknown')
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
        # Initialize the Strands Agent with Bedrock model
        model = BedrockModel(
            model_id=os.environ.get('BEDROCK_MODEL_ID', 'anthropic.claude-3-5-sonnet-20241022-v2:0'),
            region_name=os.environ.get('AWS_REGION', 'us-west-2'),
        )

        agent = Agent(
            model=model,
            tools=[get_color_hex_code, analyze_color_psychology],
            system_prompt="""You are a color theory expert with a PhD in chromatics and 20 years 
of experience in textile analysis. You have access to tools to look up color hex codes and 
analyze color psychology. Use these tools to provide comprehensive color analysis.

When analyzing a color for sock compatibility, you must:
1. Use the get_color_hex_code tool to find the exact hex code
2. Use the analyze_color_psychology tool to understand the psychological impact
3. Provide a validity score (0-100) for whether this is a real, recognizable color
4. Write a 200-word essay on its cultural significance in fashion

Always respond in JSON format with these fields:
- validityScore: number (0-100)
- culturalEssay: string (200 words)
- hexCode: string
- colorFamily: string
- mood: string"""
        )

        # Run the agent with the color analysis prompt
        prompt = f"""Analyze the color "{color}" for a sock. 
Use your tools to look up the hex code and psychological analysis, 
then provide a comprehensive color validity assessment."""

        response = agent(prompt)
        
        # Parse the response
        response_text = str(response)
        
        # Try to extract JSON from response
        try:
            json_match = response_text[response_text.find('{'):response_text.rfind('}')+1]
            analysis = json.loads(json_match) if json_match else {}
        except (json.JSONDecodeError, ValueError):
            analysis = {
                "validityScore": 75,
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
            "timestamp": datetime.now().isoformat(),
            "validityScore": analysis.get("validityScore", 75),
            "culturalEssay": analysis.get("culturalEssay", "Color analysis complete."),
            "hexCode": analysis.get("hexCode", "#808080"),
            "colorFamily": analysis.get("colorFamily", "unknown"),
            "mood": analysis.get("mood", "neutral"),
            "processingTime": processing_time,
            "cost": 0.003,  # Approximate cost
            "vote": "for" if analysis.get("validityScore", 75) > 50 else "against",
            "confidence": analysis.get("validityScore", 75),
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
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "vote": "abstain",
            "confidence": 0,
            "processingTime": (datetime.now() - start_time).total_seconds() * 1000,
        }
        publish_event("ColorAgentCompleted", error_result)
        raise
