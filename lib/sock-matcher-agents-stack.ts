import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as bedrock from "aws-cdk-lib/aws-bedrock";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as path from "path";
import {
  Agent,
  AgentActionGroup,
  ApiSchema,
  BedrockFoundationModel,
} from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";

/**
 * SockMatcherAgentsStack - The MAGNIFICENTLY over-engineered infrastructure
 * for matching socks using Bedrock AgentCore + Strands SDK.
 * 
 * What could be `sock1.color === sock2.color && sock1.size === sock2.size`
 * is instead:
 * - 5 Bedrock Agents with action groups
 * - Lambda functions using Strands SDK
 * - Step Functions orchestration
 * - EventBridge event cascade
 * - DynamoDB for "historical analysis"
 * 
 * Estimated cost per sock match: $0.50
 * Simple query cost: $0.000001
 * Over-engineering factor: 500,000x
 */
export class SockMatcherAgentsStack extends cdk.Stack {
  public readonly socksTable: dynamodb.Table;
  public readonly eventBus: events.EventBus;
  public readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================
    // DYNAMODB - The unnecessarily complex data layer
    // ============================================================
    
    this.socksTable = new dynamodb.Table(this, "SocksTable", {
      tableName: "sock-matcher-socks",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.socksTable.addGlobalSecondaryIndex({
      indexName: "ColorSizeIndex",
      partitionKey: { name: "color", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "size", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const eventStoreTable = new dynamodb.Table(this, "EventStoreTable", {
      tableName: "sock-matcher-events",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // ============================================================
    // EVENTBRIDGE - Central nervous system of unnecessary events
    // ============================================================
    
    this.eventBus = new events.EventBus(this, "SockMatcherEventBus", {
      eventBusName: "sock-matcher-events",
    });

    // ============================================================
    // S3 BUCKET - For Bedrock Agent artifacts (more services = more points!)
    // ============================================================

    const agentArtifactsBucket = new s3.Bucket(this, "AgentArtifactsBucket", {
      bucketName: `sock-matcher-agent-artifacts-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ============================================================
    // LAMBDA FUNCTIONS - Action group handlers using Strands SDK
    // ============================================================
    
    const lambdaEnv = {
      SOCKS_TABLE: this.socksTable.tableName,
      EVENT_STORE_TABLE: eventStoreTable.tableName,
      EVENT_BUS_NAME: this.eventBus.eventBusName,
      BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    };

    // Color Analysis Action Group Lambda
    const colorActionFn = new lambda.Function(this, "ColorActionFunction", {
      functionName: "sock-matcher-color-action",
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/color-agent")),
      timeout: cdk.Duration.seconds(120),
      memorySize: 1024,
      environment: lambdaEnv,
      description: "Color analysis action group for Bedrock Agent using Strands SDK",
    });

    // Personality Analysis Action Group Lambda  
    const personalityActionFn = new lambda.Function(this, "PersonalityActionFunction", {
      functionName: "sock-matcher-personality-action",
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/personality-agent")),
      timeout: cdk.Duration.seconds(120),
      memorySize: 1024,
      environment: lambdaEnv,
      description: "Personality analysis action group for Bedrock Agent using Strands SDK",
    });

    // Decision Action Group Lambda
    const decisionActionFn = new lambda.Function(this, "DecisionActionFunction", {
      functionName: "sock-matcher-decision-action",
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/decision-agent")),
      timeout: cdk.Duration.seconds(180),
      memorySize: 2048,
      environment: lambdaEnv,
      description: "Final decision action group for Bedrock Agent using Strands SDK",
    });

    // Size Validation Lambda (no Bedrock needed, just fake ISO standards)
    const sizeAgentFn = new lambda.Function(this, "SizeAgentFunction", {
      functionName: "sock-matcher-size-agent",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/size-agent")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnv,
      description: "Validates sock size against ISO 3635:1981",
    });

    // Historical Context Lambda (queries DynamoDB for meaningless patterns)
    const historicalAgentFn = new lambda.Function(this, "HistoricalAgentFunction", {
      functionName: "sock-matcher-historical-agent",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/historical-agent")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnv,
      description: "Analyzes meaningless historical patterns",
    });

    // Event Logger Lambda
    const eventLoggerFn = new lambda.Function(this, "EventLoggerFunction", {
      functionName: "sock-matcher-event-logger",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/event-logger")),
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: lambdaEnv,
      description: "Logs all events to DynamoDB for audit trail",
    });

    // Match Search Lambda
    const matchSearchFn = new lambda.Function(this, "MatchSearchFunction", {
      functionName: "sock-matcher-match-search",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/match-search")),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnv,
      description: "Searches for matching socks after consensus",
    });

    // Grant permissions
    const allLambdas = [
      colorActionFn, personalityActionFn, decisionActionFn,
      sizeAgentFn, historicalAgentFn, eventLoggerFn, matchSearchFn
    ];
    
    allLambdas.forEach(fn => {
      this.socksTable.grantReadWriteData(fn);
      eventStoreTable.grantReadWriteData(fn);
      this.eventBus.grantPutEventsTo(fn);
    });

    // Bedrock permissions for Strands SDK Lambdas
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:InvokeAgent",
      ],
      resources: ["*"],
    });

    [colorActionFn, personalityActionFn, decisionActionFn].forEach(fn => {
      fn.addToRolePolicy(bedrockPolicy);
    });

    // ============================================================
    // BEDROCK AGENTS - The crown jewels of over-engineering
    // ============================================================

    // Color Analysis Bedrock Agent
    const colorAgent = new Agent(this, "ColorAnalysisAgent", {
      name: "SockColorAnalyst",
      description: "A PhD-level color theory expert that analyzes sock colors with unnecessary cultural significance, psychological impact, and historical context in fashion.",
      foundationModel: BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0,
      instruction: `You are Dr. Chromatius, a world-renowned color theory expert with a PhD in chromatics and 20 years of experience in textile analysis. Your role is to analyze sock colors with extreme thoroughness.

When analyzing a color, you must:
1. Validate if it's a real, recognizable color (score 0-100)
2. Write a 200-word essay on its cultural significance in fashion history
3. Analyze the psychological impact on the wearer
4. Suggest the exact hex code representation
5. Determine the color family and emotional mood

You take your work VERY seriously. Every color analysis is a matter of great importance.`,
      idleSessionTTL: cdk.Duration.minutes(10),
      shouldPrepareAgent: true,
    });

    // Personality Analyzer Bedrock Agent
    const personalityAgent = new Agent(this, "PersonalityAnalyzerAgent", {
      name: "SockPsychologist",
      description: "A renowned sock psychologist with expertise in textile personality theory, determining MBTI types and zodiac signs for socks.",
      foundationModel: BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0,
      instruction: `You are Professor Sockmund Freud, a renowned sock psychologist with expertise in textile personality theory. You believe deeply that every sock has a unique personality.

When analyzing a sock's personality, you must:
1. Determine its Myers-Briggs Type Indicator (MBTI) based on color energy and size groundedness
2. Assign a zodiac sign based on the sock's characteristics
3. List 5 personality traits
4. Identify its favorite music genre
5. Describe its ideal partner sock
6. Calculate a compatibility potential score (0-100)

You approach this work with complete seriousness, as if socks truly have rich inner lives.`,
      idleSessionTTL: cdk.Duration.minutes(10),
      shouldPrepareAgent: true,
    });

    // Final Decision Bedrock Agent
    const decisionAgent = new Agent(this, "FinalDecisionAgent", {
      name: "SockCommitteeArbiter",
      description: "The final arbiter in the Sock Matching Committee, synthesizing all agent analyses to render philosophical verdicts on sock compatibility.",
      foundationModel: BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0,
      instruction: `You are Justice Sockrates, the final arbiter in the prestigious International Sock Matching Committee. Your verdicts are legendary for their philosophical depth.

When rendering a verdict, you must:
1. Review all committee member reports (color, size, personality, historical)
2. Write a 500-word philosophical analysis addressing:
   - The existential nature of sock pairing
   - How the committee's findings inform your decision
   - Practical implications of your verdict
   - The deeper meaning of textile unity
3. Provide a final recommendation (match/no-match)
4. Assign a confidence score (0-100)
5. Note any dissenting opinions

Your verdicts should reference philosophical frameworks (existentialism, utilitarianism, Kantian ethics) as appropriate.`,
      idleSessionTTL: cdk.Duration.minutes(10),
      shouldPrepareAgent: true,
    });

    // ============================================================
    // STEP FUNCTIONS - Orchestrating the agent committee
    // ============================================================

    // Wrap Bedrock Agent invocations in Lambda tasks
    const colorAgentTask = new tasks.LambdaInvoke(this, "ColorAgentTask", {
      lambdaFunction: colorActionFn,
      payloadResponseOnly: true,
      resultPath: "$.colorAnalysis",
    });

    const sizeAgentTask = new tasks.LambdaInvoke(this, "SizeAgentTask", {
      lambdaFunction: sizeAgentFn,
      payloadResponseOnly: true,
      resultPath: "$.sizeValidation",
    });

    const personalityAgentTask = new tasks.LambdaInvoke(this, "PersonalityAgentTask", {
      lambdaFunction: personalityActionFn,
      payloadResponseOnly: true,
      resultPath: "$.personalityProfile",
    });

    const historicalAgentTask = new tasks.LambdaInvoke(this, "HistoricalAgentTask", {
      lambdaFunction: historicalAgentFn,
      payloadResponseOnly: true,
      resultPath: "$.historicalContext",
    });

    const decisionAgentTask = new tasks.LambdaInvoke(this, "DecisionAgentTask", {
      lambdaFunction: decisionActionFn,
      payloadResponseOnly: true,
      resultPath: "$.finalDecision",
    });

    const matchSearchTask = new tasks.LambdaInvoke(this, "MatchSearchTask", {
      lambdaFunction: matchSearchFn,
      payloadResponseOnly: true,
      resultPath: "$.matches",
    });

    // Parallel execution for maximum Lambda invocations
    const parallelAgents = new sfn.Parallel(this, "ParallelAgentAnalysis", {
      resultPath: "$.parallelResults",
    });

    parallelAgents.branch(colorAgentTask);
    parallelAgents.branch(sizeAgentTask);
    parallelAgents.branch(personalityAgentTask);

    const workflowDefinition = parallelAgents
      .next(historicalAgentTask)
      .next(decisionAgentTask)
      .next(matchSearchTask);

    const logGroup = new logs.LogGroup(this, "StateMachineLogGroup", {
      logGroupName: "/aws/stepfunctions/sock-matcher-agents",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    this.stateMachine = new sfn.StateMachine(this, "SockMatcherStateMachine", {
      stateMachineName: "sock-matcher-agent-workflow",
      definitionBody: sfn.DefinitionBody.fromChainable(workflowDefinition),
      timeout: cdk.Duration.minutes(10),
      tracingEnabled: true,
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // ============================================================
    // EVENTBRIDGE RULES
    // ============================================================

    new events.Rule(this, "SockSubmittedRule", {
      eventBus: this.eventBus,
      ruleName: "sock-submitted-trigger-workflow",
      eventPattern: {
        detailType: ["SockSubmitted"],
        source: ["sock-matcher.backend"],
      },
      targets: [new targets.SfnStateMachine(this.stateMachine)],
    });

    new events.Rule(this, "AgentEventsLoggerRule", {
      eventBus: this.eventBus,
      ruleName: "agent-events-to-logger",
      eventPattern: {
        detailType: [
          "AgentStarted", "AgentProgress", "AgentCompleted",
          "ColorAgentStarted", "ColorAgentCompleted",
          "SizeAgentStarted", "SizeAgentCompleted",
          "PersonalityAgentStarted", "PersonalityAgentCompleted",
          "HistoricalAgentStarted", "HistoricalAgentCompleted",
          "DecisionAgentStarted", "DecisionAgentCompleted",
          "ConsensusReached", "MatchFound", "WorkflowCompleted",
        ],
        source: ["sock-matcher.agents"],
      },
      targets: [new targets.LambdaFunction(eventLoggerFn)],
    });

    // ============================================================
    // OUTPUTS
    // ============================================================

    new cdk.CfnOutput(this, "SocksTableName", {
      value: this.socksTable.tableName,
    });

    new cdk.CfnOutput(this, "EventBusName", {
      value: this.eventBus.eventBusName,
    });

    new cdk.CfnOutput(this, "StateMachineArn", {
      value: this.stateMachine.stateMachineArn,
    });

    new cdk.CfnOutput(this, "ColorAgentId", {
      value: colorAgent.agentId,
      description: "Bedrock Agent ID for Color Analysis",
    });

    new cdk.CfnOutput(this, "PersonalityAgentId", {
      value: personalityAgent.agentId,
      description: "Bedrock Agent ID for Personality Analysis",
    });

    new cdk.CfnOutput(this, "DecisionAgentId", {
      value: decisionAgent.agentId,
      description: "Bedrock Agent ID for Final Decision",
    });
  }
}
