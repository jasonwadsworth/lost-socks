#!/bin/bash
# Test script for Sock Matcher Agents workflow
# This script publishes a SockSubmitted event to EventBridge and monitors the workflow

set -e

REGION="us-west-2"
EVENT_BUS="sock-matcher-events"
SOCK_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
COLOR="blue"
SIZE="medium"

echo "🧦 Testing Sock Matcher Agents Workflow"
echo "========================================"
echo "Sock ID: $SOCK_ID"
echo "Color: $COLOR"
echo "Size: $SIZE"
echo ""

# Publish SockSubmitted event to EventBridge
echo "📡 Publishing SockSubmitted event to EventBridge..."
aws events put-events \
  --region $REGION \
  --entries "[{
    \"EventBusName\": \"$EVENT_BUS\",
    \"Source\": \"sock-matcher.backend\",
    \"DetailType\": \"SockSubmitted\",
    \"Detail\": \"{\\\"sockId\\\": \\\"$SOCK_ID\\\", \\\"color\\\": \\\"$COLOR\\\", \\\"size\\\": \\\"$SIZE\\\", \\\"timestamp\\\": \\\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\\"}\"
  }]"

echo ""
echo "✅ Event published! The AI agent committee is now deliberating..."
echo ""
echo "🔍 Check Step Functions execution:"
echo "   aws stepfunctions list-executions --state-machine-arn arn:aws:states:$REGION:831926593673:stateMachine:sock-matcher-agent-workflow --region $REGION"
echo ""
echo "📊 Check CloudWatch Logs:"
echo "   aws logs tail /aws/stepfunctions/sock-matcher-agents --region $REGION --follow"
echo ""
echo "🎭 The 5 agents will now analyze your sock:"
echo "   1. Dr. Chromatius (Color Analysis)"
echo "   2. ISO Standards Expert (Size Validation)"
echo "   3. Prof. Sockmund Freud (Personality Analysis)"
echo "   4. Data Archaeologist (Historical Context)"
echo "   5. Justice Sockrates (Final Decision)"
echo ""
echo "⏱️  Estimated time: 30-60 seconds"
echo "💰 Estimated cost: \$0.15-0.50"
