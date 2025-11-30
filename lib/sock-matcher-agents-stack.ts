import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import * as path from "path";

/**
 * SockMatcherAgentsStack - The magnificently over-engineered infrastructure
 * for matching socks using a committee of AI agents.
 * 
 * What could be `sock1.color === sock2.color && sock1.size === sock2.size`
 * is instead a cascade of 20+ events flowing through EventBridge,
 * triggering 5 AI agents to debate sock compatibility.
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
    
    // Main socks table with GSI for color+size queries
    this.socksTable = new dynamodb.Table(this, "SocksTable", {
      tableName: "sock-matcher-socks",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // GSI for querying by color and size (the only thing that actually matters)
    this.socksTable.addGlobalSecondaryIndex({
      indexName: "ColorSizeIndex",
      partitionKey: { name: "color", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "size", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Event store table - because we need to log EVERYTHING
    const eventStoreTable = new dynamodb.Table(this, "EventStoreTable", {
      tableName: "sock-matcher-events",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: "ttl",
    });

    // ============================================================
    // EVENTBRIDGE - The central nervous system of unnecessary events
    // ============================================================
    
    this.eventBus = new events.EventBus(this, "SockMatcherEventBus", {
      eventBusName: "sock-matcher-events",
    });

    // ============================================================
    // LAMBDA FUNCTIONS - One per agent because microservices!
    // ============================================================
    
    // Shared Lambda environment
    const lambdaEnv = {
      SOCKS_TABLE: this.socksTable.tableName,
      EVENT_STORE_TABLE: eventStoreTable.tableName,
      EVENT_BUS_NAME: this.eventBus.eventBusName,
      BEDROCK_MODEL_ID: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    };

    // Color Analysis Agent - PhD in chromatics
    const colorAgentFn = new lambda.Function(this, "ColorAgentFunction", {
      functionName: "sock-matcher-color-agent",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/color-agent")),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: lambdaEnv,
      description: "Analyzes sock color with unnecessary cultural significance",
    });

    // Size Validation Agent - ISO standards expert
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

    // Personality Analyzer Agent - Sock psychologist
    const personalityAgentFn = new lambda.Function(this, "PersonalityAgentFunction", {
      functionName: "sock-matcher-personality-agent",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/personality-agent")),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: lambdaEnv,
      description: "Determines sock MBTI type and zodiac sign",
    });

    // Historical Context Agent - Data archaeologist  
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

    // Final Decision Agent - Philosophical arbiter
    const decisionAgentFn = new lambda.Function(this, "DecisionAgentFunction", {
      functionName: "sock-matcher-decision-agent",
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/decision-agent")),
      timeout: cdk.Duration.seconds(90),
      memorySize: 1024,
      environment: lambdaEnv,
      description: "Writes 500-word essays about sock compatibility",
    });

    // Event Logger - Stores all events in DynamoDB
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

    // Match Search Handler - Triggered after consensus
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

    // Grant DynamoDB permissions
    const allLambdas = [
      colorAgentFn, sizeAgentFn, personalityAgentFn,
      historicalAgentFn, decisionAgentFn, eventLoggerFn, matchSearchFn
    ];
    
    allLambdas.forEach(fn => {
      this.socksTable.grantReadWriteData(fn);
      eventStoreTable.grantReadWriteData(fn);
      this.eventBus.grantPutEventsTo(fn);
    });

    // Grant Bedrock access to AI agents
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
      resources: ["*"],
    });

    [colorAgentFn, personalityAgentFn, decisionAgentFn].forEach(fn => {
      fn.addToRolePolicy(bedrockPolicy);
    });


    // ============================================================
    // STEP FUNCTIONS - The workflow orchestrator for agent committee
    // ============================================================

    // Create Lambda invoke tasks for each agent
    const colorAgentTask = new tasks.LambdaInvoke(this, "ColorAgentTask", {
      lambdaFunction: colorAgentFn,
      outputPath: "$.Payload",
      resultPath: "$.colorAnalysis",
    });

    const sizeAgentTask = new tasks.LambdaInvoke(this, "SizeAgentTask", {
      lambdaFunction: sizeAgentFn,
      outputPath: "$.Payload",
      resultPath: "$.sizeValidation",
    });

    const personalityAgentTask = new tasks.LambdaInvoke(this, "PersonalityAgentTask", {
      lambdaFunction: personalityAgentFn,
      outputPath: "$.Payload",
      resultPath: "$.personalityProfile",
    });

    const historicalAgentTask = new tasks.LambdaInvoke(this, "HistoricalAgentTask", {
      lambdaFunction: historicalAgentFn,
      outputPath: "$.Payload",
      resultPath: "$.historicalContext",
    });

    const decisionAgentTask = new tasks.LambdaInvoke(this, "DecisionAgentTask", {
      lambdaFunction: decisionAgentFn,
      outputPath: "$.Payload",
      resultPath: "$.finalDecision",
    });

    const matchSearchTask = new tasks.LambdaInvoke(this, "MatchSearchTask", {
      lambdaFunction: matchSearchFn,
      outputPath: "$.Payload",
      resultPath: "$.matches",
    });

    // Parallel execution for Color, Size, and Personality agents
    // Because why analyze sequentially when you can burn more Lambda invocations?
    const parallelAgents = new sfn.Parallel(this, "ParallelAgentAnalysis", {
      resultPath: "$.parallelResults",
    });

    parallelAgents.branch(colorAgentTask);
    parallelAgents.branch(sizeAgentTask);
    parallelAgents.branch(personalityAgentTask);

    // Define the workflow: Parallel → Historical → Decision → Match Search
    const workflowDefinition = parallelAgents
      .next(historicalAgentTask)
      .next(decisionAgentTask)
      .next(matchSearchTask);

    // Create the state machine with logging (because we need MORE logs)
    const logGroup = new logs.LogGroup(this, "StateMachineLogGroup", {
      logGroupName: "/aws/stepfunctions/sock-matcher-agents",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    this.stateMachine = new sfn.StateMachine(this, "SockMatcherStateMachine", {
      stateMachineName: "sock-matcher-agent-workflow",
      definitionBody: sfn.DefinitionBody.fromChainable(workflowDefinition),
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true, // X-Ray tracing for maximum observability
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // ============================================================
    // EVENTBRIDGE RULES - Route events to their destinations
    // ============================================================

    // Rule 1: SockSubmitted → Trigger Step Functions
    new events.Rule(this, "SockSubmittedRule", {
      eventBus: this.eventBus,
      ruleName: "sock-submitted-trigger-workflow",
      eventPattern: {
        detailType: ["SockSubmitted"],
        source: ["sock-matcher.backend"],
      },
      targets: [new targets.SfnStateMachine(this.stateMachine)],
    });

    // Rule 2: All agent events → Event Logger (audit trail)
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
    // OUTPUTS - For connecting backend and debugging
    // ============================================================

    new cdk.CfnOutput(this, "SocksTableName", {
      value: this.socksTable.tableName,
      description: "DynamoDB table for sock storage",
    });

    new cdk.CfnOutput(this, "EventBusName", {
      value: this.eventBus.eventBusName,
      description: "EventBridge bus for agent events",
    });

    new cdk.CfnOutput(this, "StateMachineArn", {
      value: this.stateMachine.stateMachineArn,
      description: "Step Functions state machine ARN",
    });

    new cdk.CfnOutput(this, "EventBusArn", {
      value: this.eventBus.eventBusArn,
      description: "EventBridge bus ARN for backend integration",
    });
  }
}
