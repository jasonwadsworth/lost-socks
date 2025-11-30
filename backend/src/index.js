import express from 'express';
import cors from 'cors';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { SFNClient, StartExecutionCommand, DescribeExecutionCommand } from '@aws-sdk/client-sfn';
import { v4 as uuidv4 } from 'uuid';
import SockRepository from './repositories/SockRepository.js';
import SockService from './services/SockService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// AWS Clients
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-west-2' });
const sfn = new SFNClient({ region: process.env.AWS_REGION || 'us-west-2' });

// Configuration
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'sock-matcher-events';
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN || '';

// Initialize repository and service
const sockRepository = new SockRepository();
const sockService = new SockService(sockRepository);

// Track workflow executions
const workflowExecutions = new Map();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', eventBus: EVENT_BUS_NAME });
});

/**
 * POST /api/socks
 * Register a new sock and trigger the AI agent committee
 * Request body: { color: string, size: string }
 * Response: { id: string, color: string, size: string, workflowId: string, status: string }
 */
app.post('/api/socks', async (req, res) => {
  try {
    const { color, size } = req.body;

    // Input validation
    if (!color || typeof color !== 'string' || color.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input: color is required and must be a non-empty string'
      });
    }

    if (!size || typeof size !== 'string' || size.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input: size is required and must be a non-empty string'
      });
    }

    // Create sock using service (local storage)
    const sock = sockService.createSock(color.trim(), size.trim());
    const workflowId = `workflow-${sock.id}`;

    // Publish SockSubmitted event to EventBridge
    // This triggers the magnificently over-engineered agent committee!
    try {
      await eventBridge.send(new PutEventsCommand({
        Entries: [{
          EventBusName: EVENT_BUS_NAME,
          Source: 'sock-matcher.backend',
          DetailType: 'SockSubmitted',
          Detail: JSON.stringify({
            sockId: sock.id,
            color: sock.color,
            size: sock.size,
            timestamp: new Date().toISOString(),
            workflowId,
          }),
        }],
      }));
      console.log(`[Backend] Published SockSubmitted event for sock ${sock.id}`);
    } catch (eventError) {
      console.error('[Backend] Failed to publish event:', eventError.message);
      // Continue anyway - the sock is still created locally
    }

    // Track the workflow
    workflowExecutions.set(sock.id, {
      workflowId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      agentResults: {},
    });

    res.status(201).json({
      id: sock.id,
      color: sock.color,
      size: sock.size,
      workflowId,
      status: 'pending',
      message: 'Sock submitted! The AI agent committee is now deliberating...',
      estimatedTime: '30-60 seconds',
    });
  } catch (error) {
    console.error('Error creating sock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/socks/:id/status
 * Get the status of the agent workflow for a sock
 * Response: { status: string, currentAgent: string, progress: number, agentResults: object }
 */
app.get('/api/socks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const workflow = workflowExecutions.get(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Simulate agent progress (in production, query Step Functions or DynamoDB)
    const elapsed = Date.now() - new Date(workflow.startedAt).getTime();
    const agents = ['ColorAgent', 'SizeAgent', 'PersonalityAgent', 'HistoricalAgent', 'DecisionAgent'];
    const agentDuration = 6000; // 6 seconds per agent
    
    const completedAgents = Math.min(Math.floor(elapsed / agentDuration), 5);
    const currentAgentIndex = Math.min(completedAgents, 4);
    const progress = Math.min((elapsed / (agentDuration * 5)) * 100, 100);

    const status = completedAgents >= 5 ? 'complete' : 'analyzing';
    const currentAgent = status === 'complete' ? 'None' : agents[currentAgentIndex];

    res.json({
      sockId: id,
      workflowId: workflow.workflowId,
      status,
      currentAgent,
      progress: Math.round(progress),
      completedAgents: agents.slice(0, completedAgents),
      estimatedTimeRemaining: status === 'complete' ? 0 : Math.max(0, 30 - Math.floor(elapsed / 1000)),
      agentResults: workflow.agentResults,
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/socks/:id/matches
 * Get all matching socks for a given sock ID
 * Response: { matches: [...], deliberationSummary: string, agentVotes: [...] }
 */
app.get('/api/socks/:id/matches', (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid input: id must be a valid UUID'
      });
    }

    const sock = sockRepository.findById(id);
    if (!sock) {
      return res.status(404).json({ error: 'Sock not found' });
    }

    const matches = sockService.findMatches(id);
    const workflow = workflowExecutions.get(id);

    // Generate mock agent deliberation (in production, fetch from DynamoDB)
    const agentVotes = [
      { agent: 'ColorAnalysisAgent', vote: 'for', confidence: 95, reasoning: 'Color is valid and culturally significant' },
      { agent: 'SizeValidationAgent', vote: 'for', confidence: 100, reasoning: 'Size complies with ISO 3635:1981' },
      { agent: 'PersonalityAnalyzerAgent', vote: 'for', confidence: 87, reasoning: 'MBTI type ENFP shows high compatibility' },
      { agent: 'HistoricalContextAgent', vote: 'for', confidence: 92, reasoning: 'Historical match rate: 100%' },
      { agent: 'FinalDecisionAgent', vote: 'for', confidence: 98, reasoning: 'Unanimous consensus achieved' },
    ];

    res.json({
      matches: matches.map(match => ({
        id: match.id,
        color: match.color,
        size: match.size,
        compatibilityScore: 100,
      })),
      totalMatches: matches.length,
      agentVotes,
      deliberationSummary: `The Sock Matching Committee has reached unanimous consensus. All 5 agents voted in favor of matchability for this ${sock.color} ${sock.size} sock. The philosophical implications of this pairing have been thoroughly analyzed.`,
      processingTime: workflow ? Date.now() - new Date(workflow.startedAt).getTime() : 0,
      estimatedCost: '$0.15',
    });
  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/socks/:id/transcript
 * Get the full agent deliberation transcript
 */
app.get('/api/socks/:id/transcript', (req, res) => {
  const { id } = req.params;
  const sock = sockRepository.findById(id);
  
  if (!sock) {
    return res.status(404).json({ error: 'Sock not found' });
  }

  // Generate mock transcript (in production, fetch from DynamoDB event store)
  res.json({
    sockId: id,
    transcript: [
      {
        agent: 'ColorAnalysisAgent',
        timestamp: new Date(Date.now() - 25000).toISOString(),
        analysis: `As Dr. Chromatius, I have conducted a thorough chromatic analysis of the color "${sock.color}". This color carries deep cultural significance, representing ${sock.color === 'blue' ? 'trust and stability' : 'passion and energy'}. The psychological impact on the wearer is profound. Validity score: 95/100.`,
        tokenUsage: 450,
        cost: 0.002,
      },
      {
        agent: 'SizeValidationAgent',
        timestamp: new Date(Date.now() - 20000).toISOString(),
        analysis: `Size "${sock.size}" has been validated against ISO 3635:1981 (Clothing sizes - Definitions and body measurement procedures). COMPLIANCE STATUS: FULLY COMPLIANT. This sock meets all international standards for foot coverage.`,
        tokenUsage: 0,
        cost: 0.0001,
      },
      {
        agent: 'PersonalityAnalyzerAgent',
        timestamp: new Date(Date.now() - 15000).toISOString(),
        analysis: `As Professor Sockmund Freud, I have determined this sock's personality profile. MBTI Type: ENFP (The Campaigner). Zodiac: Sagittarius. This sock is adventurous, warm, and seeks meaningful connections with compatible footwear.`,
        tokenUsage: 520,
        cost: 0.002,
      },
      {
        agent: 'HistoricalContextAgent',
        timestamp: new Date(Date.now() - 10000).toISOString(),
        analysis: `Historical analysis complete. Match success rate for ${sock.color} ${sock.size} socks: 100%. Trend direction: Upward. Seasonal correlation: Strong affinity with current season. Monte Carlo simulation predicts 94.7% probability of finding a compatible match.`,
        tokenUsage: 0,
        cost: 0.0002,
      },
      {
        agent: 'FinalDecisionAgent',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        analysis: `As Justice Sockrates, I render my final verdict. After careful consideration of all committee reports, I find this sock to be FULLY MATCHABLE. The existential journey of this sock from solitude to potential pairing represents the fundamental human desire for connection. Consensus: UNANIMOUS. Confidence: 98%.`,
        tokenUsage: 890,
        cost: 0.004,
      },
    ],
    totalCost: 0.0083,
    totalTokens: 1860,
  });
});

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🧦 Sock Matcher Backend running on port ${PORT}`);
    console.log(`📡 EventBridge bus: ${EVENT_BUS_NAME}`);
    console.log(`🤖 Ready to orchestrate the AI agent committee!`);
  });
}

export default app;
