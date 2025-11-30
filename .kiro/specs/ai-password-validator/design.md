# Design Document

## Overview

This design document outlines an AI-powered password validation system that leverages Amazon Bedrock's large language models to determine password length compliance during Cognito user registration. The system replaces traditional character counting (`password.length >= 8`) with natural language processing, demonstrating the pinnacle of over-engineering for a trivial problem.

The architecture integrates AWS Cognito User Pools, Lambda functions, and Amazon Bedrock to create a distributed, AI-powered solution for what could be accomplished with a single line of code.

## Architecture

The system follows an event-driven architecture with AI inference in the critical path:

```
User Sign-up Request
        ↓
Cognito User Pool
        ↓
Pre Sign-up Lambda Trigger
        ↓
Construct Prompt
        ↓
Amazon Bedrock (LLM Inference)
        ↓
Parse LLM Response
        ↓
Accept/Reject Sign-up
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud                                │
│                                                              │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │  Cognito User    │         │   Lambda Function       │  │
│  │      Pool        │────────▶│  (Pre Sign-up Trigger)  │  │
│  │                  │         │                         │  │
│  └──────────────────┘         │  - Extract password     │  │
│                                │  - Build prompt         │  │
│                                │  - Invoke Bedrock       │  │
│                                │  - Parse response       │  │
│                                └───────────┬─────────────┘  │
│                                            │                 │
│                                            ▼                 │
│                                ┌─────────────────────────┐  │
│                                │   Amazon Bedrock        │  │
│                                │   (Claude/Llama)        │  │
│                                │                         │  │
│                                │  Foundation Model API   │  │
│                                └─────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Cognito User Pool

**Purpose**: Managed user directory for authentication

**Configuration**:

- User pool name: "AIPasswordValidatorUserPool"
- Password policy: Delegated to AI (ironically)
- Pre sign-up trigger: Lambda function ARN
- Auto-verify attributes: email

**CDK Resource**:

```typescript
const userPool = new cognito.UserPool(this, "UserPool", {
  userPoolName: "AIPasswordValidatorUserPool",
  selfSignUpEnabled: true,
  signInAliases: {
    email: true,
  },
  autoVerify: {
    email: true,
  },
  lambdaTriggers: {
    preSignUp: preSignUpLambda,
  },
});
```

### Pre Sign-up Lambda Function

**Purpose**: Intercept sign-up requests and validate password using AI

**Runtime**: Node.js 20.x (or latest)

**Environment Variables**:

- `BEDROCK_MODEL_ID`: The Bedrock model identifier (e.g., "anthropic.claude-3-haiku-20240307-v1:0")
- `MIN_PASSWORD_LENGTH`: Minimum required password length (default: 8)
- `BEDROCK_REGION`: AWS region for Bedrock service

**Dependencies**:

- `@aws-sdk/client-bedrock-runtime`: For invoking Bedrock models

**Handler Logic**:

```typescript
export async function handler(
  event: PreSignUpTriggerEvent
): Promise<PreSignUpTriggerEvent> {
  const password = event.request.password;

  // Construct prompt for LLM
  const prompt = buildPasswordValidationPrompt(password);

  // Invoke Bedrock
  const isValid = await validatePasswordWithAI(prompt);

  if (!isValid) {
    throw new Error(
      "Password does not meet length requirements (as determined by AI)"
    );
  }

  return event;
}
```

### Bedrock Integration Module

**Purpose**: Handle communication with Amazon Bedrock

**Key Functions**:

1. **buildPasswordValidationPrompt(password: string): string**

   - Constructs a carefully engineered prompt
   - Includes instructions for character counting
   - Specifies response format

2. **invokeBedrockModel(prompt: string): Promise<string>**

   - Calls Bedrock Runtime API
   - Handles model-specific request formatting
   - Returns raw LLM response

3. **parseValidationResponse(response: string): boolean**
   - Extracts validation result from natural language
   - Handles various response formats
   - Returns true/false for password validity

## Data Models

### Cognito Pre Sign-up Event

```typescript
interface PreSignUpTriggerEvent {
  version: string;
  triggerSource: "PreSignUp_SignUp" | "PreSignUp_AdminCreateUser";
  region: string;
  userPoolId: string;
  userName: string;
  request: {
    userAttributes: {
      [key: string]: string;
    };
    validationData?: {
      [key: string]: string;
    };
    password: string;
  };
  response: {
    autoConfirmUser: boolean;
    autoVerifyEmail: boolean;
    autoVerifyPhone: boolean;
  };
}
```

### Bedrock Request Payload

```typescript
interface BedrockInvokeRequest {
  modelId: string;
  contentType: "application/json";
  accept: "application/json";
  body: string; // JSON stringified model-specific payload
}

// For Claude models
interface ClaudeRequestBody {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  temperature: number;
}
```

### Bedrock Response Payload

```typescript
interface BedrockInvokeResponse {
  body: Uint8Array; // Contains JSON response
}

// For Claude models
interface ClaudeResponseBody {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

## Prompt Engineering Strategy

### Prompt Template

```
You are a password validation system. Your task is to count the exact number of characters in a password and determine if it meets the minimum length requirement.

Password to validate: "{PASSWORD}"
Minimum required length: {MIN_LENGTH} characters

Please:
1. Count the exact number of characters in the password
2. Compare it to the minimum required length
3. Respond with ONLY "VALID" if the password has {MIN_LENGTH} or more characters, or "INVALID" if it has fewer

Your response:
```

### Prompt Design Rationale

- **Explicit instructions**: LLMs need clear guidance for simple tasks
- **Structured output**: Request specific format for easy parsing
- **No ambiguity**: Avoid creative responses that complicate parsing
- **Character counting**: The core "AI" task that replaces `password.length`

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Properties

**Property 1: Password extraction from events**
_For any_ Cognito Pre Sign-up event containing a password field, the Lambda function should successfully extract the password value
**Validates: Requirements 1.2**

**Property 2: Prompt construction completeness**
_For any_ password string, the constructed prompt should include: the password itself, instructions to count characters, the minimum length threshold (8), and a request for structured output format
**Validates: Requirements 1.3, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5**

**Property 3: Bedrock invocation success**
_For any_ valid prompt, the system should successfully invoke the Bedrock API without throwing exceptions (assuming service availability)
**Validates: Requirements 1.4**

**Property 4: Response parsing robustness**
_For any_ LLM response containing "VALID" or "INVALID" keywords, the parser should correctly extract a boolean determination
**Validates: Requirements 1.5, 3.5**

**Property 5: Malformed response handling**
_For any_ LLM response that doesn't match the expected format, the system should handle it gracefully by logging and rejecting the sign-up
**Validates: Requirements 6.3**

### Examples

**Example 1: Cognito trigger configuration**
After CDK deployment, the Cognito User Pool should have a Pre Sign-up Lambda trigger configured that invokes the validation function
**Validates: Requirements 1.1, 4.1, 4.2**

**Example 2: Bedrock model configuration**
The Lambda function should have environment variables set for BEDROCK_MODEL_ID (e.g., "anthropic.claude-3-haiku-20240307-v1:0") and MIN_PASSWORD_LENGTH (8)
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.4**

**Example 3: IAM permissions**
The Lambda execution role should have permissions to invoke Bedrock models (bedrock:InvokeModel action)
**Validates: Requirements 2.5, 3.1, 4.5**

**Example 4: Lambda dependencies**
The Lambda function package should include @aws-sdk/client-bedrock-runtime as a dependency
**Validates: Requirements 4.3**

**Example 5: Invalid password rejection**
When the LLM determines a password is invalid (< 8 characters), the Lambda should throw an error that prevents sign-up completion
**Validates: Requirements 1.6**

**Example 6: Service unavailability handling**
When Bedrock returns a service unavailable error, the Lambda should return an appropriate error response
**Validates: Requirements 6.1**

**Example 7: Timeout handling**
When the Bedrock invocation exceeds the timeout threshold, the Lambda should reject the sign-up with a timeout error
**Validates: Requirements 6.2**

**Example 8: Retry logic**
When network errors occur, the Lambda should implement exponential backoff retry logic (e.g., 3 retries with 100ms, 200ms, 400ms delays)
**Validates: Requirements 6.4**

**Example 9: Retry exhaustion**
When all retry attempts are exhausted, the Lambda should fail the sign-up with a clear error message
**Validates: Requirements 6.5**

**Example 10: Bedrock API response structure**
When Bedrock successfully processes a request, it should return a response containing the LLM's text output
**Validates: Requirements 3.4**

## Error Handling

### Bedrock Service Errors

**Service Unavailable (503)**:

- Log error with request ID
- Return error to Cognito: "Password validation service temporarily unavailable"
- User sees: Sign-up failed, please try again later

**Throttling (429)**:

- Implement exponential backoff (3 retries)
- Delays: 100ms, 200ms, 400ms
- If all retries fail, return throttling error

**Model Not Found (404)**:

- Log critical error with model ID
- Return error: "Password validation configuration error"
- Indicates infrastructure misconfiguration

### Timeout Handling

**Bedrock Invocation Timeout**:

- Set Lambda timeout: 30 seconds
- Set Bedrock client timeout: 25 seconds
- If timeout occurs:
  - Log timeout event
  - Return error: "Password validation timed out"

### Response Parsing Errors

**Unexpected Response Format**:

- Log full LLM response for debugging
- Attempt to find "VALID" or "INVALID" keywords
- If parsing fails completely:
  - Reject sign-up with error
  - Alert: "Unable to validate password format"

**Empty Response**:

- Log error with request details
- Return error: "Password validation returned no result"

### Lambda Execution Errors

**Missing Environment Variables**:

- Check for BEDROCK_MODEL_ID at startup
- Fail fast with clear error message
- Prevents runtime failures

**SDK Errors**:

- Catch all AWS SDK exceptions
- Log error details
- Return generic error to user

## Testing Strategy

### Unit Tests

Unit tests will verify individual components and specific scenarios:

1. **Prompt Construction Tests**:

   - Test prompt includes password
   - Test prompt includes minimum length
   - Test prompt requests structured output
   - Test prompt formatting is correct

2. **Response Parsing Tests**:

   - Test parsing "VALID" response
   - Test parsing "INVALID" response
   - Test parsing malformed responses
   - Test parsing empty responses

3. **Error Handling Tests**:

   - Test Bedrock service unavailable
   - Test timeout scenarios
   - Test retry logic
   - Test retry exhaustion

4. **Event Processing Tests**:
   - Test password extraction from Cognito event
   - Test event response formatting
   - Test error throwing for invalid passwords

Testing framework: Jest with TypeScript support

### Property-Based Tests

Property-based tests will verify universal behaviors across many inputs:

1. **Property Test: Password Extraction**

   - Generate random Cognito events with various password values
   - Verify extraction always succeeds for valid events
   - Library: fast-check (JavaScript PBT library)

2. **Property Test: Prompt Structure**

   - Generate random passwords (various lengths, characters)
   - Verify all prompts contain required elements
   - Verify prompts are valid strings

3. **Property Test: Response Parsing**
   - Generate various LLM response formats
   - Verify parser handles all expected formats
   - Verify parser rejects malformed responses appropriately

Testing framework: fast-check with Jest

### Integration Tests

1. **End-to-End Bedrock Integration**:

   - Test actual Bedrock API calls (in test environment)
   - Verify real LLM responses are parsed correctly
   - Test with various password lengths

2. **Cognito Trigger Integration**:

   - Deploy to test environment
   - Attempt sign-ups with various passwords
   - Verify correct accept/reject behavior

3. **Error Scenario Integration**:
   - Test with invalid model IDs
   - Test with network interruptions
   - Verify graceful degradation

### Test Organization

```
test/
├── unit/
│   ├── prompt-builder.test.ts
│   ├── response-parser.test.ts
│   ├── error-handler.test.ts
│   └── event-processor.test.ts
├── property/
│   ├── password-extraction.property.test.ts
│   ├── prompt-structure.property.test.ts
│   └── response-parsing.property.test.ts
└── integration/
    ├── bedrock-integration.test.ts
    └── cognito-trigger.test.ts
```

### Mock Strategy

**Bedrock Client Mocking**:

- Mock `@aws-sdk/client-bedrock-runtime` for unit tests
- Use actual client for integration tests
- Mock responses should match real Bedrock response structure

**Cognito Event Mocking**:

- Create factory functions for test events
- Include various password scenarios
- Match actual Cognito event structure

## Deployment Considerations

### CDK Stack Structure

```typescript
export class AIPasswordValidatorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for password validation
    const preSignUpLambda = new lambda.Function(this, "PreSignUpFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("lambda"),
      timeout: cdk.Duration.seconds(30),
      environment: {
        BEDROCK_MODEL_ID: "anthropic.claude-3-haiku-20240307-v1:0",
        MIN_PASSWORD_LENGTH: "8",
        BEDROCK_REGION: this.region,
      },
    });

    // Grant Bedrock permissions
    preSignUpLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"], // Or specific model ARN
      })
    );

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "AIPasswordValidatorUserPool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      lambdaTriggers: {
        preSignUp: preSignUpLambda,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPool.addClient("AppClient").userPoolClientId,
    });
  }
}
```

### Lambda Function Structure

```
lambda/
├── index.ts                 # Handler entry point
├── bedrock-client.ts        # Bedrock API wrapper
├── prompt-builder.ts        # Prompt construction logic
├── response-parser.ts       # LLM response parsing
├── error-handler.ts         # Error handling utilities
└── types.ts                 # TypeScript interfaces
```

### Environment Variables

| Variable            | Description                         | Example Value                          |
| ------------------- | ----------------------------------- | -------------------------------------- |
| BEDROCK_MODEL_ID    | Bedrock foundation model identifier | anthropic.claude-3-haiku-20240307-v1:0 |
| MIN_PASSWORD_LENGTH | Minimum required password length    | 8                                      |
| BEDROCK_REGION      | AWS region for Bedrock service      | us-west-2                              |
| LOG_LEVEL           | Logging verbosity                   | INFO                                   |

### Performance Considerations

**Expected Latency**:

- Bedrock API call: 500-2000ms (depending on model)
- Lambda cold start: 1-3 seconds
- Lambda warm execution: 500-2500ms total
- Total sign-up delay: 1-5 seconds

**Cost Implications** (for hackathon entertainment):

- Traditional validation: $0.00 per request
- AI-powered validation: ~$0.001-0.01 per request
- Cost increase: ∞% (from free to paid)
- Value added: Questionable

**Scalability**:

- Bedrock has rate limits (varies by model)
- Lambda can scale to handle concurrent sign-ups
- Consider throttling for high-volume scenarios
- Each sign-up requires one LLM inference

## Security Considerations

### Password Handling

**Concern**: Passwords are sent to Bedrock for processing

**Mitigation**:

- Passwords are transmitted over TLS
- Bedrock doesn't store prompts by default
- Consider enabling Bedrock audit logging
- Document that passwords are processed by third-party AI

**Alternative**: Hash passwords before sending to LLM (defeats the purpose but adds another layer of absurdity)

### IAM Permissions

**Principle**: Least privilege

**Lambda Role Permissions**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:*:*:model/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### Bedrock Model Access

**Requirement**: Enable model access in Bedrock console

**Steps**:

1. Navigate to Bedrock console
2. Request access to Claude or Llama models
3. Wait for approval (usually instant for Haiku)
4. Verify model ID matches Lambda configuration

## Monitoring and Observability

### CloudWatch Metrics

**Lambda Metrics**:

- Invocations
- Duration
- Errors
- Throttles
- Cold starts

**Custom Metrics**:

- Bedrock invocation count
- Bedrock response time
- Password validation success rate
- Password validation failure rate

### CloudWatch Logs

**Log Groups**:

- `/aws/lambda/PreSignUpFunction`

**Log Events**:

- Password validation requests (without password value)
- Bedrock invocation details
- LLM responses
- Parsing results
- Error details

### Alarms

**Recommended Alarms**:

1. Lambda error rate > 5%
2. Lambda duration > 25 seconds
3. Bedrock throttling errors
4. High validation failure rate (> 50%)

## Future Enhancements (Even More Impractical)

1. **Multi-Model Consensus**: Query 3 different LLMs and use majority vote
2. **Blockchain Verification**: Store validation results on-chain for immutability
3. **Quantum Computing**: Use quantum algorithms for character counting
4. **Distributed Validation**: Split password across multiple LLMs for parallel processing
5. **AI Training Pipeline**: Continuously retrain model on password validation outcomes
6. **Sentiment Analysis**: Reject passwords with negative sentiment
7. **Image Generation**: Convert password to image, use computer vision to count characters
