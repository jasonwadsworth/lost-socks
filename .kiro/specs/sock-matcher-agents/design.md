# Design Document

## Overview

The Sock Matcher Agents application is a **magnificently over-engineered** full-stack web application that uses **pure event-driven multi-agent AI orchestration** to solve the trivial problem of matching socks by color and size. What could be accomplished with a simple database query (`sock1.color === sock2.color && sock1.size === sock2.size`) is instead handled by a cascade of events flowing through Amazon EventBridge that trigger a committee of AI agents to debate, analyze, and reach consensus on sock compatibility.

The system is **100% event-driven with EventBridge as the central nervous system**: when a user submits a sock, the backend publishes a `SockSubmitted` event to EventBridge. EventBridge rules trigger a Step Functions workflow, which spawns five specialized agents via Lambda. Each agent publishes events (`AgentStarted`, `AgentProgress`, `AgentCompleted`) back to EventBridge. EventBridge routes these events to DynamoDB for storage, to the backend for WebSocket broadcasting, and to trigger subsequent workflow steps. The final `ConsensusReached` event triggers match searching, which publishes `MatchFound` events, creating a beautiful cascade of 20+ events for what should be a single function call.

**Key Architectural Principle**: Everything is an event. No direct function calls. No synchronous operations. Every component communicates exclusively through EventBridge events, creating maximum latency, maximum AWS service usage, and maximum entertainment value.

The architecture follows an **event-driven agent-orchestrated microservices model** with breathtaking separation of concerns. The frontend handles user interaction, EventBridge routes ALL communication, Step Functions orchestrates agent workflows, Lambda functions execute agents, and a parliament of AI agents makes decisions that could be made with simple string comparison—all communicated through events.

**Why This Exists**: To demonstrate the AWS Strands Agents SDK and event-driven architecture in the most entertaining way possible while scoring maximum points in the Road to Reinvent hackathon for Impracticality (40 pts), Pointlessness (35 pts), and Entertainment (25 pts).

## Architecture

### High-Level Architecture (Event-Driven Sock Committee System)

```
┌─────────────────┐
│  React Frontend │
│   (User Input)  │
│  + WebSocket    │
└────────┬────────┘
         │ 1. POST /api/socks
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Backend (Event Publisher)               │
│  - Publishes SockSubmitted event to EventBridge             │
│  - Subscribes to agent events for WebSocket forwarding      │
└────────┬────────────────────────────────────────────────────┘
         │ 2. SockSubmitted event
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Amazon EventBridge                        │
│              (Central Event Bus - Routes Everything)         │
│                                                              │
│  Event Types:                                                │
│  - SockSubmitted → Triggers Step Functions                  │
│  - AgentStarted → Logged & forwarded to WebSocket           │
│  - AgentCompleted → Triggers next agent in workflow         │
│  - ConsensusReached → Triggers match search                 │
│  - MatchFound → Notifies frontend                           │
└────┬────────────┬────────────┬────────────┬────────────┬───┘
     │            │            │            │            │
     │ 3. Triggers Step Functions workflow
     ▼
┌──────────────────────────────────────────────────────────────┐
│              AWS Step Functions (Workflow Engine)             │
│  - Orchestrates agent execution sequence                     │
│  - Publishes events at each state transition                 │
│  - Handles retries and error states                          │
└────┬────────────┬────────────┬────────────┬────────────┬────┘
     │            │            │            │            │
     │ 4. Invokes Lambda functions (one per agent)
     ▼            ▼            ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Color   │  │  Size   │  │Personality│ │Historical│ │ Final   │
│Analysis │  │Validator│  │ Analyzer │  │ Context │  │Decision │
│ Agent   │  │ Agent   │  │  Agent   │  │  Agent  │  │ Agent   │
│(Lambda) │  │(Lambda) │  │(Lambda)  │  │(Lambda)  │  │(Lambda) │
│         │  │         │  │          │  │         │  │         │
│Bedrock  │  │ISO API  │  │Bedrock   │  │DynamoDB │  │Bedrock  │
└────┬────┘  └────┬────┘  └────┬─────┘  └────┬────┘  └────┬────┘
     │            │            │             │            │
     │ 5. Each agent publishes events:
     │    - AgentStarted (when beginning)
     │    - AgentProgress (during execution)
     │    - AgentCompleted (when finished)
     │
     └────────────┴────────────┴─────────────┴────────────┘
                              │
                              │ 6. All events flow back to EventBridge
                              ▼
                    ┌──────────────────┐
                    │  EventBridge     │
                    │  (Routes events) │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
       ┌──────────────────┐    ┌──────────────────┐
       │    DynamoDB      │    │  Backend Server  │
       │  (Event Store &  │    │  (WebSocket      │
       │   Sock Registry) │    │   Broadcaster)   │
       └──────────────────┘    └──────────────────┘
                                        │
                                        │ 7. Real-time updates
                                        ▼
                               ┌─────────────────┐
                               │ React Frontend  │
                               │ (Live Updates)  │
                               └─────────────────┘
```

### Event Catalog (20+ Event Types!)

**Sock Lifecycle Events:**
1. `SockSubmitted` - User submits a sock via API
2. `SockValidated` - Input validation passed
3. `WorkflowInitiated` - Step Functions execution started
4. `Soc Sock saved toynamoDB

**ecycle Events (5 ages × 3vents = 15 eve
[. `ColorAgentStSoted` - Color ackSubmittegins
6. `ColorAgentProgd] ───────lor agent p─────────pdate
7. `ColorAgentCompleted` - Color analysis finished
8. `SizeAgentStarted` - Size validation begins
9. `SizeAgentProgress` - Size agent provides update
10. `SizeAgentCompleted` - Size validation finished
11. `PersonalityAgentStarted` - Personality analysis begins
12. `PersonalityAgentProgress` - Personality agent provides update
13. `PersonalityAgentCompleted` - Personality analysis finished
14. `HistoricalAgentStarted` - Historical analysis begins
15. `HistoricalAgentProgress` - Historical agent provides update
16. `HistoricalAgentCompleted` - Historical analysis finished
17. `DecisionAgentStarted` - Final decision begins
18. `DecisionAgentProgress` - Decision agent provides update
19. `DecisionAgentCompleted` - Final decision finished

**Consensus & Matching Events:**
20. `VotesCollected` - All agent votes gathered
21. `ConsensusReached` - 3+ agents agree
22. `ConsensusFailure` - Agents disagree (rare)
23. `MatchSearchInitiated` - Begin searching for matches
24. `MatchFound` - Compatible sock discovered
25. `NoMatchesFound` - No compatible socks exist
──────────────ltsStored` - Ma────────┐ saved to

**Notification Eve       │                                               │
       ▼  cketNotificatio          eal-time updat   ent to frontend
2           wCompleted` - Ent         ss finished
29. `Wo   lowFailed         │g went wrong

**Wh Is Ridiculous
- 29 events for what Step Fune 1 functioctions Starts                                  │
   very event tr    │s 2-3 downstream      ns
- EventBridg          a bottlenec           e operation                     │
       ▼routing adds 5     ms latency per                                           │
[Workflct for demonstratingowSent-driven arctarted]re!

### Event ────────────────────────────────────┤

```
User Submit  Sock
       │     │                                               │
       ▼
[1] SockS       ├──>ent → EventBridge [ColorAgentStarted] ──> [ColorAgentCompleted]
       │                                               │
       ▼
[       ├──idge Rule trigge> [SizeAFunctions
  gentSt
       ▼
arted] ──> [Initiated event → EventSizeAg
       │
       ▼
[4] Step Fenttions invokes ColCompleteLambda
     d]
       ▼
[      │    ntStarted ev         ntBridge     bSocket
       │
       ▼
[6] ColorAgent          event → Even  ridge
       │
       ├─→ DynamoDB (stor      │
       ├─→ WebSocky frontend)
       └─ions (ow)
   │
       ▼
  -19] Repeat for      ├──> [Pality, HistoriersonDecisialityAges
       │
ntStart▼
[20] ConsensusReached] ─ent → EventBr─> [PersonalityAgentCompleted]
       │
       ▼
[21   │       chInitiated           mbda
                                  │
       ▼
[22] Match    ▼ events (        match) → Event      
       │
       ├─        DB (store matches)
       ├─→ WebSocket (noti           )
       └─→ Clou          │ everyth
[P     │arallelAgentsCompleted] ────────────────────────────┤
       ▼
[23] WorkflowC     ted event → EventBri│                                               │
       │
       └─→ Fron▼    displays resul  

Total Eve         0 per sock regist      
Total    ency: 30       onds
To          $0.15
Simple Alter        │function call, 10$0.000001
[H`

### Evenistoric Rules CoalAgentStan

**Rule 1rted]k Submission Handler**
- Event Pattern: `{ "detail-type": ["SockSubmitted"] }`
- Target: Step Functions state machine
- Purpose: Initiate agent workflow

**Rule 2: Agent Progress Broadcaster**
- Event Pattern: `{ "detail-type": ["*AgentStarted", "*AgentProgress", "*AgentCompleted"] }`
- Targets:
  - Lambda function (WebSocket broadcaster)
  - DynamoDB (event store)
  - CloudWatch Logs (audit trail)
- Purpose: Real-time updates and logging

**Rule 3: Consensus Handler**
- Event Pattern: `{ "detail-type": ["ConsensusReached"] }`
- Target: Lambda function (match search)
- Purpose: Trigger match finding

**Rule 4: Match Notification Handler**
- Event Pattern: `{ "detail-type": ["MatchFound", "NoMatchesFound"] }`
- Targets:
  - Lambda function (WebSocket broadcaster)
  - DynamoDB (store results)
- Purpose: Notify frontend of results

**Rule 5: Workflow Completion Handler**
- Event Pattern: `{ "detail-type": ["WorkflowCompleted", "WorkflowFailed"] }`
- Targets:
  - CloudWatch Logs (final audit)
  - DynamoDB (update status)
  - SNS (optional notifications)
- Purpose: Cleanup and final notifications

### Event Flow Diagram (Simplified)

```
User Submits Sock
       │
       ▼ ──> [HistoricalAgentCompleted]
       │                                               │
       ▼                                               │
[DecisionAgentStarted] ──> [DecisionAgentCompleted] ──┤
       │                                               │
       ▼                                               │
[ConsensusReached] ────────────────────────────────────┤
       │                                               │
       ▼                                               │
[MatchSearchStarted] ──> [MatchFound] ─────────────────┤
       │                                               │
       ▼                                               │
[WorkflowCompleted] ───────────────────────────────────┘
       │
       ▼
   All events logged to CloudWatch
   All events stored in DynamoDB
   All events traced in X-Ray
   All events forwarded to WebSocket
```

### Technology Stack

**Frontend:**
- React 18 for UI components
- WebSocket for real-time agent progress updates
- Tailwind CSS for styling (because we need a build step)
- TypeScript (adds compilation complexity)
- Vite for bundling (more tooling!)

**Backend:**
- Node.js 20+ runtime with TypeScript
- Express.js web framework
- Socket.io for WebSocket connections
- AWS SDK v3 for service integrations
- **AWS Strands Agents SDK** (the star of the show)

**AI Agent Infrastructure:**
- **AWS Strands Agents SDK** - Framework for building and orchestrating agents
- **AWS Bedrock** - For running Claude/other LLMs to analyze sock attributes
- **AWS Lambda** - For serverless agent execution
- **AWS Step Functions** - For orchestrating multi-agent workflows
- **Amazon DynamoDB** - For storing sock data and agent deliberation history
- **Amazon SQS** - For agent-to-agent communication queues
- **Amazon EventBridge** - For triggering agent workflows and notifications
- **AWS X-Ray** - For tracing the ridiculous complexity
- **Amazon CloudWatch** - For logging every single decision

**Why This Stack?**
- ✅ Turns a 10ms operation into a 30-second orchestrated workflow
- ✅ Requires 7+ AWS services for string comparison
- ✅ **Event-driven architecture** - Every action triggers events, events trigger more events
- ✅ Generates enough CloudWatch logs to fill a small database
- ✅ Costs approximately $0.15 per sock match (vs $0.000001 for a simple query)
- ✅ Demonstrates cutting-edge AI agent orchestration
- ✅ Maximum "But why?" factor

## Event-Driven Architecture

### Core Principle: Everything is an Event

The system is built on the principle that **every action must trigger an event**, and **every event can trigger more events**. This creates a beautiful cascade of unnecessary complexity where a simple sock submission results in 20+ events flowing through the system.

### Event Types

**User-Initiated Events:**
- `SockSubmitted` - User submits a sock via frontend
- `MatchRequested` - User requests to see matches

**Workflow Events:**
- `WorkflowStarted` - Step Functions execution begins
- `WorkflowCompleted` - All agents finished successfully
- `WorkflowFailed` - Something went wrong (rare)

**Agent Lifecycle Events:**
- `AgentStarted` - Agent begins analysis (5 events, one per agent)
- `AgentProgress` - Agent provides progress update (optional)
- `AgentCompleted` - Agent finishes analysis (5 events)
- `AgentFailed` - Agent encountered an error

**Decision Events:**
- `ParallelAgentsCompleted` - Color, Size, and Personality agents all done
- `ConsensusReached` - Decision agent determines match compatibility
- `MatchSearchStarted` - System begins searching for matching socks
- `MatchFound` - Matching sock(s) discovered
- `NoMatchFound` - No compatible socks exist

**System Events:**
- `CostCalculated` - AWS cost metrics updated
- `AuditLogCreated` - Deliberation history stored
- `MetricsPublished` - Performance metrics logged

### Event Routing with EventBridge

All events flow through Amazon EventBridge, which acts as the central nervous system:

1. **Event Ingestion**: Backend publishes events to EventBridge
2. **Event Routing**: EventBridge rules route events to appropriate targets:
   - Step Functions for workflow orchestration
   - Lambda for agent execution
   - DynamoDB for event storage
   - CloudWatch for logging
   - Backend WebSocket for real-time updates
3. **Event Fanout**: Single event can trigger multiple targets simultaneously

### Why Event-Driven is Perfect for This Hackathon

- **Impracticality**: Adds latency and complexity at every step
- **Pointlessness**: Events for operations that don't need events
- **Entertainment**: Watching events cascade is mesmerizing
- **Technical Showmanship**: Demonstrates modern event-driven architecture
- **Debuggability**: Every action is logged (whether you want it or not)

## Components and Interfaces

### Frontend Components

**SockForm Component**
- Renders input fields for color and size
- Handles form submission with loading spinner (because this takes 30+ seconds)
- Calls backend API to register sock
- Displays real-time agent activity updates via WebSocket
- Shows progress bar as each agent completes their analysis (5 stages)
- Displays success/error messages with full agent deliberation transcript

**AgentProgressTracker Component**
- Real-time visualization of agent committee activity
- Shows which agent is currently "thinking"
- Displays completion status for each of the 5 agents
- Animated progress indicators with agent avatars
- Estimated time remaining (always wrong)

**MatchList Component**
- Displays a list of matching socks with AI-generated compatibility scores
- Fetches matches from backend API
- Shows color, size, and agent reasoning for each match
- Includes agent vote breakdown (e.g., "3 for, 0 against, 2 abstained")
- Displays estimated carbon footprint of the match calculation
- "View Full Deliberation" button to see 500-word agent analysis

**AgentTranscript Component**
- Expandable panel showing full agent deliberation
- Displays each agent's reasoning process
- Shows timestamps and token usage per agent
- Includes cost breakdown by agent
- Syntax-highlighted JSON of agent outputs

**App Component**
- Main container component
- Manages routing between registration and match views
- Coordinates child components
- Displays real-time AWS cost meter (increments during agent execution)
- WebSocket connection management

### Backend API Endpoints

**POST /api/socks**
- Request body: `{ color: string, size: string, userId?: string }`
- Response: `{ id: string, color: string, size: string, workflowId: string, estimatedCompletionTime: number }`
- Triggers Step Functions workflow to orchestrate agent committee
- Returns immediately with workflow ID for status polling
- Publishes "SockRegistrationStarted" event to EventBridge

**GET /api/socks/:id/status**
- Response: `{ status: 'pending' | 'analyzing' | 'complete' | 'failed', currentAgent: string, progress: number, agentResults: AgentResult[] }`
- Polls the Step Functions execution status
- Returns which agent is currently deliberating
- Includes partial results from completed agents

**GET /api/socks/:id/matches**
- Response: `{ matches: SockMatch[], deliberationLog: AgentVote[], totalProcessingTime: number, costEstimate: number }`
- Returns matches with full agent reasoning
- Includes 500-word explanation of why socks match
- Provides audit trail of all agent decisions
- Cost breakdown by AWS service

**GET /api/socks/:id/agent-transcript**
- Response: `{ transcript: AgentTranscript[], workflow: WorkflowExecution, metrics: ExecutionMetrics }`
- Full transcript of agent deliberations
- Shows each agent's reasoning process
- Includes timestamps, token usage, and costs per agent
- Step Functions execution history

**WebSocket Events**
- `agent:started` - Agent begins analysis
- `agent:progress` - Agent provides progress update
- `agent:completed` - Agent finishes analysis
- `workflow:complete` - All agents finished
- `workflow:failed` - Something went wrong (rare)

### The Sock Committee Agents (Powered by Strands Agents SDK)

**1. Color Analysis Agent** (`ColorAnalystAgent`)
- **Purpose**: Validates that the color is a real color and analyzes its cultural significance
- **Implementation**: Calls Amazon Bedrock with Claude 3.5 Sonnet
- **Prompt**: "As a color theory expert with a PhD in chromatics, analyze if '{color}' is a valid color. Provide a 200-word essay on its cultural significance, psychological impact, and historical context in fashion."
- **Processing Time**: 3-5 seconds
- **Output**: Color validity score (0-100), cultural analysis essay, hex code suggestion
- **Why It's Ridiculous**: Could be `const validColors = ['red', 'blue', 'black', 'white', 'gray']`

**2. Size Validation Agent** (`SizeValidatorAgent`)
- **Purpose**: Ensures size is legitimate according to international standards
- **Implementation**: Lambda function that queries an external ISO standards API (or pretends to)
- **Process**: Checks if size matches ISO 3635:1981 (Clothing sizes - Definitions and body measurement procedures)
- **Processing Time**: 2-3 seconds
- **Output**: Size validity boolean, ISO compliance report, size category classification
- **Why It's Ridiculous**: Could be `['small', 'medium', 'large'].includes(size)`

**3. Personality Analyzer Agent** (`PersonalityAgent`)
- **Purpose**: Determines sock "personality" for compatibility matching
- **Implementation**: Uses Bedrock to generate personality profile based on color and size
- **Prompt**: "Based on this sock's color ({color}) and size ({size}), write a detailed personality profile. Include Myers-Briggs type, astrological sign, favorite music genre, and compatibility traits. Be creative but thorough."
- **Processing Time**: 5-8 seconds
- **Output**: MBTI type, zodiac sign, personality traits, compatibility score
- **Why It's Ridiculous**: Socks don't have personalities

**4. Historical Context Agent** (`HistoricalAgent`)
- **Purpose**: Analyzes past matching patterns to inform current decision
- **Implementation**: Queries DynamoDB for all previous matches, runs statistical analysis
- **Process**: 
  - Retrieves all historical matches for this color/size combination
  - Calculates "match success rate" (always 100% because they all match)
  - Generates trend analysis and predictions
  - Creates meaningless charts and graphs
- **Processing Time**: 4-6 seconds
- **Output**: Historical match rate, trend analysis, confidence score
- **Why It's Ridiculous**: Every match is independent; history is irrelevant

**5. Final Decision Agent** (`DecisionAgent`)
- **Purpose**: Synthesizes all agent inputs and makes final compatibility determination
- **Implementation**: Claude 3.5 Sonnet via Bedrock with 4000-token context window
- **Prompt**: "You are the final arbiter in a sock matching committee. Given these agent reports: {colorAnalysis}, {sizeValidation}, {personalityProfile}, {historicalContext}, write a comprehensive 500-word analysis of whether these socks should match. Consider philosophical implications, practical concerns, and the existential nature of sock pairing. Provide a final recommendation with confidence score."
- **Processing Time**: 8-12 seconds
- **Output**: 500-word philosophical analysis, final decision (yes/no), confidence score (0-100)
- **Why It's Ridiculous**: The answer is always `color1 === color2 && size1 === size2`

### Agent Orchestration Service

**StrandsAgentOrchestrator**
- `initializeCommittee(sock: Sock)`: Spawns all 5 agents for a sock registration
- `coordinateDeliberation(sock1: Sock, sock2: Sock)`: Runs agents in sequence via Step Functions
- `collectVotes()`: Gathers agent outputs from SQS queues
- `reachConsensus(votes: AgentVote[])`: Determines if 3+ agents agree (they always do)
- `generateReport(votes: AgentVote[])`: Compiles 1000-word match report
- `publishResults(result: MatchResult)`: Writes to DynamoDB and triggers EventBridge event
- `estimateCost(workflow: WorkflowExecution)`: Calculates AWS costs for the operation

**SockRepository** (DynamoDB-backed)
- `save(sock: Sock)`: Stores sock with full agent analysis
- `findById(id: string)`: Retrieves sock with agent metadata
- `findByColorAndSize(color: string, size: string)`: Queries GSI (Global Secondary Index)
- `getAgentHistory(sockId: string)`: Returns all agent deliberations for a sock
- `getMatchStatistics()`: Calculates meaningless statistics across all socks
- `saveAgentVote(vote: AgentVote)`: Stores individual agent decision
- `getWorkflowExecution(workflowId: string)`: Retrieves Step Functions execution details

## The Sock Committee Workflow (Event-Driven Edition)

### Step-by-Step Process (What Should Take 10ms Takes 30+ Seconds)

**Phase 0: User Submission** (0ms)
- Frontend sends `{ color: "blue", size: "medium" }`
- Backend receives HTTP POST request
- Generates unique sock ID and workflow ID
- **EVENT**: Publishes `SockSubmitted` event to EventBridge
  ```json
  {
    "eventType": "SockSubmitted",
    "sockId": "uuid-123",
    "color": "blue",
    "size": "medium",
    "timestamp": "2025-11-30T18:00:00Z"
  }
  ```

**Phase 1: Event-Driven Orchestrator Initialization** (500ms)
- EventBridge receives `SockSubmitted` event
- EventBridge rule triggers Step Functions execution
- Step Functions creates execution with workflow ID
- **EVENT**: Publishes `WorkflowStarted` event
- Writes initial state to DynamoDB (sock record with status: 'pending')
- **EVENT**: DynamoDB stream triggers Lambda to publish `SockStored` event
- Backend receives `WorkflowStarted` event and forwards to WebSocket
- Frontend receives real-time update: `workflow:started`

**Phase 2: Event-Driven Agent Committee Spawning** (1000ms)
- Step Functions spawns 5 parallel Lambda functions (one per agent)
- Each Lambda receives `AgentInvoked` event with sock data
- Each Lambda initializes its Strands Agent with specific configuration
- **EVENTS**: Each agent publishes `AgentStarted` event (5 events total)
  ```json
  {
    "eventType": "ColorAgentStarted",
    "sockId": "uuid-123",
    "agentId": "color-agent-xyz",
    "timestamp": "2025-11-30T18:00:01Z"
  }
  ```
- EventBridge routes `AgentStarted` events to backend WebSocket broadcaster
- Frontend receives 5 real-time updates: `agent:started`

**Phase 3: Event-Driven Parallel Agent Analysis** (15 seconds)
- **Color Agent** (5s): 
  - **EVENT**: Publishes `ColorAgentProgress` (analyzing color theory)
  - Calls Bedrock with color analysis prompt
  - Generates 200-word cultural significance essay
  - Assigns color validity score
  - Writes result to DynamoDB
  - **EVENT**: Publishes `ColorAgentCompleted` with analysis results
  - EventBridge forwards to WebSocket: `agent:completed`
  
- **Size Agent** (3s): 
  - **EVENT**: Publishes `SizeAgentProgress` (validating ISO standards)
  - Validates against ISO standards (or pretends to)
  - Generates compliance report
  - Writes result to DynamoDB
  - **EVENT**: Publishes `SizeAgentCompleted`
  - EventBridge forwards to WebSocket: `agent:completed`
  
- **Personality Agent** (7s): 
  - **EVENT**: Publishes `PersonalityAgentProgress` (analyzing personality)
  - Calls Bedrock with personality analysis prompt
  - Generates MBTI type, zodiac sign, traits
  - Writes result to DynamoDB
  - **EVENT**: Publishes `PersonalityAgentCompleted`
  - EventBridge forwards to WebSocket: `agent:completed`

- **EVENT**: Step Functions detects all 3 parallel agents completed
- **EVENT**: Publishes `ParallelAgentsCompleted` event
- This event triggers the next phase of the workflow

**Phase 4: Event-Driven Historical Context Analysis** (6 seconds)
- `ParallelAgentsCompleted` event triggers Historical Agent Lambda
- **EVENT**: Publishes `HistoricalAgentStarted`
- **Historical Agent**: 
  - Queries DynamoDB for all past matches with same color/size
  - Runs statistical analysis (mean, median, mode of... nothing useful)
  - Generates trend report and predictions
  - Calculates "match success rate" (always 100%)
  - Writes result to DynamoDB
  - **EVENT**: Publishes `HistoricalAgentCompleted`
  - EventBridge forwards to WebSocket: `agent:completed`

**Phase 5: Event-Driven Consensus Building** (8 seconds)
- `HistoricalAgentCompleted` event triggers Decision Agent Lambda
- **EVENT**: Publishes `DecisionAgentStarted`
- **Decision Agent**: 
  - Reads all previous agent outputs from DynamoDB
  - Constructs 2000-token prompt with all agent reports
  - Calls Claude 3.5 Sonnet via Bedrock
  - Receives 500-word philosophical treatise on sock compatibility
  - Generates final recommendation with confidence score
  - Writes result to DynamoDB
  - **EVENT**: Publishes `DecisionAgentCompleted`
  - **EVENT**: Publishes `ConsensusReached` with final decision
  - EventBridge forwards to WebSocket: `agent:completed`
workingonSI querieatogging
lizationionh
- Full deliberaments throughout
- Wattion -t votvents for a sie brs
- Event cascadeeak oation
- "Butst downcalculation
-
- activity visual
**Demo-Worthy tern (s acr
- Live event foss eventsort of)
- CloudWatch event- X-Ray dributed 
- Event sourcinaocket updatesith Step Fudge**
- Mudrock LLM inteand event showK
- **Evend
**Entnt fanount (25):**
- WatchiThis Is Mamxplainingretrieves= true`
- ISO standaatcies when inith agennld work
- 500-word etanayysiis fr ndependent ebjects
- Histos md loperations that do operation
hat could be `===`
- Eventlessness (35/35 pointbS:**
- AI agents
**Phase 7: Event-Driven Notification & Logging** (2 seconds)
- **EVENT**: Publishes `WorkflowCompleted` event
- EventBridge routes to multiple targets:
  - CloudWatch Logs (full audit trail)
  - X-Ray (distributed trace)
  - DynamoDB (cost metrics update)
  - Backend WebSocket (final notification)
- **EVENT**: Publishes `CostCalculated` with total AWS spend
- **EVENT**: Publishes `AuditLogCreated` with deliberation history
- **EVENT**: Publishes `MetricsPublished` with performance data
- Frontend receives final WebSocket event: `workflow:complete`
- User sees results with full agent deliberation transcript
sockission  
**Equivaleme**: 30-35 ery**: 10ms, $0.0 0 events  ore expensive, ore ev
**Eftaliency Ratio**: ed**: 20+ eslower, 1
**Equivalent Simple Query**: 10ms, $0.000001  
**Efficiency Ratio**: 3,000,000% slower, 150,000% more expensive

### Why This Is Magnificent

**Impracticality (40/40 points):**
- Uses 7+ AWS services for string comparison
- Requires Step Functions orchestration for sequential logic
- DynamoDB queries when in-memory would work
- WebSocket connections for progress updates
- 30-second latency for instant operation

**Pointlessness (35/35 points):**
- AI agents debate what could be `===`
- Personality analysis for inanimate objects
- Historical analysis of independent events
- 500-word essays explaining `true === true`
- ISO standards validation for three strings

**Entertainment (25/25 points):**
- Watching agents "deliberate" is mesmerizing
- Real-time progress bars for unnecessary work
- Cost meter incrementing in real-time
- Agent "personalities" and voting
- Full deliberation transcripts to read

**Technical Showmanship:**
- Demonstrates Strands Agents SDK
- Multi-agent orchestration with Step Functions
- Real-time WebSocket updates
- Bedrock LLM integration
- DynamoDB GSI queries
- EventBridge event-driven architecture
- X-Ray distributed tracing

**Demo-Worthy Features:**
- Live agent activity visualization
- Real-time cost calculation
- Agent vote breakdown
- Full deliberation transcripts
- "But why?" moments throughout

## Data Models

### Sock

```typescript
interface Sock {
  id: string;                    // Unique identifier (UUID)
  color: string;                 // Color of the sock
  size: string;                  // Size of the sock
  createdAt: Date;               // Timestamp when sock was registered
  workflowId: string;            // Step Functions execution ID
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  agentAnalysis: {
    colorAnalysis?: ColorAnalysis;
    sizeValidation?: SizeValidation;
    personalityProfile?: PersonalityProfile;
    historicalContext?: HistoricalContext;
    finalDecision?: FinalDecision;
  };
  processingTime: number;        // Total time in milliseconds
  costEstimate: number;          // Estimated AWS cost in USD
}
```

### Agent Analysis Results

```typescript
interface ColorAnalysis {
  agentId: string;
  timestamp: Date;
  validityScore: number;         // 0-100
  culturalEssay: string;         // 200-word analysis
  hexCode: string;               // Suggested hex code
  processingTime: number;
  tokenUsage: number;
  cost: number;
}

interface SizeValidation {
  agentId: string;
  timestamp: Date;
  isValid: boolean;
  isoCompliance: string;         // ISO standard reference
  sizeCategory: string;          // Classification
  processingTime: number;
  cost: number;
}

interface PersonalityProfile {
  agentId: string;
  timestamp: Date;
  mbtiType: string;              // e.g., "ENFP"
  zodiacSign: string;            // e.g., "Sagittarius"
  traits: string[];              // Personality traits
  musicGenre: string;            // Favorite music
  compatibilityScore: number;    // 0-100
  processingTime: number;
  tokenUsage: number;
  cost: number;
}

interface HistoricalContext {
  agentId: string;
  timestamp: Date;
  matchSuccessRate: number;      // Always 100%
  trendAnalysis: string;         // Meaningless trends
  confidenceScore: number;       // 0-100
  historicalMatches: number;     // Count of past matches
  processingTime: number;
  cost: number;
}

interface FinalDecision {
  agentId: string;
  timestamp: Date;
  decision: 'match' | 'no-match';
  philosophicalAnalysis: string; // 500-word essay
  confidenceScore: number;       // 0-100
  reasoning: string;             // Summary
  processingTime: number;
  tokenUsage: number;
  cost: number;
}
```

### Match Result

```typescript
interface SockMatch {
  sock: Sock;
  compatibilityScore: number;    // 0-100 (always 100 if color/size match)
  agentVotes: AgentVote[];
  deliberationSummary: string;   // Combined agent reasoning
  totalCost: number;             // Cost to determine this match
}

interface AgentVote {
  agentName: string;
  vote: 'for' | 'against' | 'abstain';
  reasoning: string;
  confidence: number;
  timestamp: Date;
}
```

### API Request/Response Models

**CreateSockRequest**
```typescript
{
  color: string;
  size: string;
  userId?: string;
}
```

**CreateSockResponse**
```typescript
{
  id: string;
  color: string;
  size: string;
  workflowId: string;
  estimatedCompletionTime: number;  // seconds
  status: 'pending';
}
```

**SockStatusResponse**
```typescript
{
  status: 'pending' | 'analyzing' | 'complete' | 'failed';
  currentAgent: string;
  progress: number;                  // 0-100
  agentResults: Partial<AgentAnalysis>;
  estimatedTimeRemaining: number;    // seconds
}
```

**MatchListResponse**
```typescript
{
  matches: SockMatch[];
  deliberationLog: AgentVote[];
  totalProcessingTime: number;       // milliseconds
  costEstimate: number;              // USD
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Agent workflow completion**
*For any* valid sock registration, the agent workflow should eventually complete with all 5 agents providing analysis results.
**Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5**

**Property 2: Sock storage with agent analysis**
*For any* sock that completes agent analysis, retrieving it by ID should return the sock with all agent analysis results populated.
**Validates: Requirements 1.2, 6.1**

**Property 3: Real-time progress updates**
*For any* sock registration in progress, the system should emit WebSocket events for each agent as they start and complete their analysis.
**Validates: Requirements 2.1, 2.2**

**Property 4: Match filtering with agent reasoning**
*For any* sock in the system, when requesting matches, all returned socks should have matching color AND size, and each match should include agent compatibility analysis.
**Validates: Requirements 3.1, 3.2**

**Property 5: Agent consensus requirement**
*For any* match decision, at least 3 out of 5 agents must vote in favor for the match to be considered valid.
**Validates: Requirements 5.3**

**Property 6: Deliberation audit trail**
*For any* completed agent workflow, the system should store a complete record of all agent votes, reasoning, and timestamps.
**Validates: Requirements 6.1, 6.2, 6.3**

**Property 7: Cost calculation accuracy**
*For any* completed workflow, the estimated cost should include charges from Bedrock API calls, Lambda executions, and DynamoDB operations.
**Validates: Requirements 3.2** (implied by showing cost estimates)

## Error Handling

### Frontend Error Handling
- Network errors: Display user-friendly message when backend is unreachable
- WebSocket disconnection: Attempt reconnection, fall back to polling
- Timeout errors: Show message if agent workflow takes longer than 60 seconds
- Invalid responses: Handle malformed JSON gracefully
- Empty states: Show appropriate messages when no matches are found

### Backend Error Handling
- Invalid input: Return 400 Bad Request for missing or invalid color/size
- Agent failures: Retry failed agents up to 3 times
- Step Functions failures: Catch and log errors, return 500 with workflow ID
- DynamoDB errors: Implement exponential backoff retry logic
- Bedrock throttling: Queue requests and retry with backoff
- Not found: Return 404 when requesting matches for non-existent sock ID
- Server errors: Return 500 with generic error message, log details server-side

### Agent Error Handling
- LLM timeout: Fail agent after 30 seconds, mark as 'abstain' vote
- Invalid LLM response: Parse errors gracefully, use default values
- DynamoDB write failures: Retry with exponential backoff
- SQS message failures: Use dead-letter queue for failed messages

### Validation Rules
- Color: Required, non-empty string, max 50 characters
- Size: Required, non-empty string, must be one of: small, medium, large
- ID: Must be valid UUID format when querying
- WorkflowId: Must be valid Step Functions execution ARN

## Testing Strategy

### Unit Testing
We will use Jest for unit testing both frontend and backend components.

**Frontend Unit Tests:**
- Test that SockForm renders input fields correctly
- Test that AgentProgressTracker displays agent status
- Test WebSocket event handling
- Test form validation logic

**Backend Unit Tests:**
- Test StrandsAgentOrchestrator initialization
- Test SockRepository CRUD operations
- Test API endpoint responses with specific inputs
- Test agent vote collection and consensus logic
- Test cost calculation accuracy

### Property-Based Testing
We will use fast-check for property-based testing in JavaScript/TypeScript.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Each property-based test must include a comment tag referencing the correctness property
- Tag format: `// Feature: sock-matcher-agents, Property {number}: {property_text}`

**Property Tests to Implement:**

1. **Agent Workflow Completion Property** (Property 1)
   - Generate random socks with various colors and sizes
   - Trigger agent workflow for each
   - Verify all 5 agents complete successfully
   - **Feature: sock-matcher-agents, Property 1: Agent workflow completion**

2. **Storage with Agent Analysis Property** (Property 2)
   - Generate random socks and complete agent workflows
   - Store each sock and retrieve it by ID
   - Verify all agent analysis fields are populated
   - **Feature: sock-matcher-agents, Property 2: Sock storage with agent analysis**

3. **Match Filtering with Reasoning Property** (Property 4)
   - Generate a random target sock with agent analysis
   - Generate a collection of random socks (some matching, some not)
   - Request matches for target sock
   - Verify all returned socks have matching color and size
   - Verify each match includes agent reasoning
   - **Feature: sock-matcher-agents, Property 4: Match filtering with agent reasoning**

4. **Agent Consensus Property** (Property 5)
   - Generate random agent votes for sock pairs
   - Verify consensus requires 3+ votes in favor
   - Verify matches are only created when consensus is reached
   - **Feature: sock-matcher-agents, Property 5: Agent consensus requirement**

### Integration Testing
- Test complete flow: register sock via frontend → agents analyze → retrieve matches
- Test WebSocket real-time updates during agent execution
- Test Step Functions workflow execution end-to-end
- Test DynamoDB queries with GSI
- Test Bedrock API integration (with mocks in CI/CD)
- Verify frontend and backend communicate correctly

### Agent Testing
- Mock Bedrock responses for deterministic testing
- Test each agent's prompt construction
- Test agent error handling and retries
- Test agent vote collection from SQS
- Test Step Functions state machine transitions

## Implementation Notes

### Development Approach
1. Set up AWS infrastructure (DynamoDB, Step Functions, Lambda, Bedrock access)
2. Implement Strands Agents SDK integration and agent definitions
3. Build backend orchestration service and API endpoints
4. Implement WebSocket real-time updates
5. Build frontend components with agent progress visualization
6. Integrate frontend with backend and WebSocket
7. Add error handling and validation
8. Implement cost tracking and metrics

### AWS Setup Requirements
- AWS account with Bedrock access (Claude 3.5 Sonnet model)
- IAM roles for Lambda execution
- DynamoDB table with GSI on color+size
- Step Functions state machine definition
- SQS queues for agent communication
- EventBridge event bus
- CloudWatch Logs and X-Ray tracing enabled

### Environment Variables
```
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
DYNAMODB_TABLE_NAME=sock-matcher-agents
STEP_FUNCTIONS_ARN=arn:aws:states:...
SQS_QUEUE_URL=https://sqs...
EVENTBRIDGE_BUS_NAME=sock-matcher-events
```

### Future Enhancements (Out of Scope for Hackathon)
- Add more agents (Fabric Analysis Agent, Brand Recognition Agent, etc.)
- Implement agent learning from past decisions
- Add agent personality customization
- Create agent debate visualization (agents arguing in real-time)
- Implement blockchain for immutable sock matching records
- Add quantum computing agent for ultimate over-engineering
