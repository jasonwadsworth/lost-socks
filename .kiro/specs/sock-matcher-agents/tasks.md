# Implementation Plan

- [x] 1. Set up project structure and AWS infrastructure
  - Create backend directory with Node.js/TypeScript/Express setup
  - Create frontend directory with React/TypeScript/Vite setup
  - Install dependencies: express, socket.io, aws-sdk, @aws-sdk/client-* packages
  - Set up AWS CDK for infrastructure
  - Create DynamoDB table with GSI on color+size
  - Set up Step Functions state machine definition
  - Configure EventBridge event bus and rules
  - Configure IAM roles and policies
  - _Requirements: All_

- [x] 2. Implement core data models and DynamoDB repository
  - Create TypeScript interfaces for Sock, AgentAnalysis, AgentVote, etc.
  - Implement SockRepository with in-memory storage (backend/src/repositories/SockRepository.js)
  - Add methods: save, findById, findByColorAndSize, getAll, clear
  - _Requirements: 1.2, 7.1, 7.2_

- [ ]* 2.1 Write property test for sock storage with agent analysis
  - **Property 2: Sock storage with agent analysis**
  - **Validates: Requirements 1.2, 7.1**

- [x] 3. Implement the 5 Strands Agents as Lambda functions
  - Implement ColorAnalystAgent with Bedrock integration (lambda/color-agent/index.js)
  - Implement SizeValidatorAgent with ISO validation logic (lambda/size-agent/index.js)
  - Implement PersonalityAgent with Bedrock integration (lambda/personality-agent/index.js)
  - Implement HistoricalAgent with DynamoDB queries (lambda/historical-agent/index.js)
  - Implement DecisionAgent with Bedrock integration (lambda/decision-agent/index.js)
  - Add prompt templates for each LLM-based agent
  - Implement agent result parsing and validation
  - Implement EventBridge event publishing for agent lifecycle events
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.3, 5.4_

- [ ]* 3.1 Write unit tests for each agent
  - Test ColorAnalystAgent with mocked Bedrock responses
  - Test SizeValidatorAgent validation logic
  - Test PersonalityAgent prompt construction
  - Test HistoricalAgent DynamoDB queries
  - Test DecisionAgent synthesis logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Implement Step Functions workflow orchestration
  - Create Step Functions state machine definition in CDK (lib/sock-matcher-agents-stack.ts)
  - Define states for each agent execution phase
  - Implement parallel execution for Color, Size, and Personality agents
  - Implement sequential execution for Historical and Decision agents
  - Add match search task at the end of workflow
  - Implement workflow logging with CloudWatch
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Implement Event-Driven Architecture with EventBridge
  - Create EventBridge event bus (sock-matcher-events)
  - Implement SockSubmitted → Step Functions trigger rule
  - Implement agent events → Event Logger rule for audit trail
  - Implement event publishing in all Lambda functions
  - Create Event Logger Lambda for DynamoDB audit storage (lambda/event-logger/index.js)
  - Create Match Search Lambda triggered after consensus (lambda/match-search/index.js)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 5.1 Write property test for agent workflow completion
  - **Property 1: Agent workflow completion**
  - **Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ]* 5.2 Write property test for agent consensus
  - **Property 5: Agent consensus requirement**
  - **Validates: Requirements 6.3**

- [x] 6. Implement backend API endpoints with Express
  - Create Express server with CORS and body parsing
  - Implement POST /api/socks endpoint to publish SockSubmitted event to EventBridge
  - Implement GET /api/socks/:id/status endpoint for polling Step Functions execution
  - Implement GET /api/socks/:id/matches endpoint with agent reasoning from DynamoDB
  - Implement GET /api/socks/:id/agent-transcript endpoint
  - Add input validation middleware
  - Add error handling middleware
  - Integrate with EventBridge for event publishing
  - _Requirements: 1.1, 1.3, 3.1, 3.2, 3.3_

- [ ]* 6.1 Write unit tests for API endpoints
  - Test POST /api/socks with valid input
  - Test GET /api/socks/:id/status polling
  - Test GET /api/socks/:id/matches with agent data
  - Test error cases (invalid input, not found, timeouts)
  - _Requirements: 1.1, 3.1_

- [x] 7. Implement WebSocket real-time updates
  - Set up Socket.io server integration with Express
  - Subscribe to EventBridge agent events via Lambda → WebSocket broadcaster
  - Emit agent:started events when agents begin
  - Emit agent:progress events during agent execution
  - Emit agent:completed events when agents finish
  - Emit workflow:complete and workflow:failed events
  - Add connection management and error handling
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 7.1 Write property test for real-time progress updates
  - **Property 3: Real-time progress updates**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 8. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend SockForm component (Upload.jsx)
  - Create form with color and size input fields
  - Add form validation (required fields, valid values)
  - Handle form submission with loading state
  - Display workflow ID and estimated completion time
  - Show error messages for failed submissions
  - _Requirements: 8.1, 8.2_

- [x] 10. Implement frontend AgentProgressTracker component
  - Create component to display 5 agent progress indicators
  - Connect to WebSocket for real-time updates
  - Show which agent is currently "thinking"
  - Display completion status for each agent
  - Add animated progress bars and agent avatars
  - Show estimated time remaining
  - Display agent results as they complete
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 11. Implement frontend MatchList component (Matches.jsx)
  - Create component to display list of matching socks
  - Display color, size, and compatibility score for each match
  - Show agent vote breakdown (e.g., "3 for, 0 against")
  - Display AI-generated compatibility reasoning
  - Add "View Full Deliberation" button
  - Handle empty match list with appropriate message
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Integrate frontend with real backend API
  - Update Upload.jsx to call POST /api/socks endpoint
  - Update Matches.jsx to call GET /api/socks/:id/matches endpoint
  - Implement WebSocket connection for real-time agent updates
  - Display real agent deliberation data instead of mock data
  - Add real-time AWS cost meter display
  - _Requirements: 8.2, 8.3_

- [ ]* 12.1 Write property test for match filtering with reasoning
  - **Property 4: Match filtering with agent reasoning**
  - **Validates: Requirements 3.1, 3.2**

- [x] 13. Implement frontend AgentTranscript component
  - Create expandable panel for full agent deliberation
  - Display each agent's reasoning process
  - Show timestamps and token usage per agent
  - Include cost breakdown by agent
  - Add syntax highlighting for JSON outputs
  - Implement collapsible sections for each agent
  - _Requirements: 3.2_

- [ ] 14. Implement cost tracking and metrics
  - Add cost calculation for Bedrock API calls (token-based)
  - Add cost calculation for Lambda executions
  - Add cost calculation for DynamoDB operations
  - Add cost calculation for Step Functions executions
  - Store cost metrics in DynamoDB
  - Display real-time cost updates in frontend
  - _Requirements: 3.2_ (implied by cost estimates)

- [ ]* 14.1 Write property test for cost calculation accuracy
  - **Property 7: Cost calculation accuracy**
  - **Validates: Requirements 3.2**

- [x] 15. Implement audit trail and logging
  - Add CloudWatch Logs integration for all agent activities (via CDK stack)
  - Implement X-Ray tracing for distributed workflow (enabled in Step Functions)
  - Store complete agent deliberation history in DynamoDB (event-logger Lambda)
  - Add EventBridge events for key workflow milestones
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 15.1 Write property test for deliberation audit trail
  - **Property 6: Deliberation audit trail**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 16. Add comprehensive error handling
  - Implement frontend error boundaries
  - Add backend error handling middleware
  - Implement agent retry logic (up to 3 attempts) in Step Functions
  - Add Step Functions error handling states
  - Implement WebSocket reconnection logic
  - Add timeout handling for long-running workflows
  - Display user-friendly error messages
  - _Requirements: All (error handling)_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Create demo data and documentation
  - Add sample socks for demo purposes
  - Create README with setup instructions
  - Document AWS infrastructure requirements
  - Add environment variable configuration guide
  - Create demo script for hackathon presentation
  - Document the "But Why?" talking points
  - _Requirements: All (documentation)_
