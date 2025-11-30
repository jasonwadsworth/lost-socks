/**
 * Type definitions for AI-powered password validation
 * Because TypeScript makes even the most absurd ideas look professional
 */

/**
 * Cognito Pre Sign-up Trigger Event
 * The event structure AWS Cognito sends to our Lambda function
 */
export interface PreSignUpTriggerEvent {
    version: string;
    triggerSource: 'PreSignUp_SignUp' | 'PreSignUp_AdminCreateUser';
    region: string;
    userPoolId: string;
    userName: string;
    callerContext: {
        awsSdkVersion: string;
        clientId: string;
    };
    request: {
        userAttributes: {
            [key: string]: string;
        };
        validationData?: {
            [key: string]: string;
        };
        /**
         * The password that we'll send to a large language model
         * to determine if it has 8 or more characters
         */
        password: string;
    };
    response: {
        autoConfirmUser: boolean;
        autoVerifyEmail: boolean;
        autoVerifyPhone: boolean;
    };
}

/**
 * Bedrock Runtime API - Invoke Model Request
 * Structure for calling Amazon Bedrock's foundation models
 */
export interface BedrockInvokeRequest {
    modelId: string;
    contentType: 'application/json';
    accept: 'application/json';
    body: string; // JSON stringified model-specific payload
}

/**
 * Claude Model Request Body
 * Anthropic's Claude model expects this specific format
 */
export interface ClaudeRequestBody {
    anthropic_version: string;
    max_tokens: number;
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    temperature?: number;
}

/**
 * Bedrock Runtime API - Invoke Model Response
 * The response structure from Bedrock
 */
export interface BedrockInvokeResponse {
    body: Uint8Array; // Contains JSON response that needs to be decoded
    contentType: string;
}

/**
 * Claude Model Response Body
 * The structure of Claude's response after decoding
 */
export interface ClaudeResponseBody {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
        type: 'text';
        text: string;
    }>;
    model: string;
    stop_reason: string;
    stop_sequence?: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

/**
 * Environment variables for Lambda configuration
 */
export interface LambdaEnvironment {
    BEDROCK_MODEL_ID: string;
    MIN_PASSWORD_LENGTH: string;
    BEDROCK_REGION: string;
    LOG_LEVEL?: string;
}

/**
 * Password validation result
 * The output of our AI-powered character counting system
 */
export interface ValidationResult {
    isValid: boolean;
    reason?: string;
    characterCount?: number; // If the LLM was kind enough to tell us
}
