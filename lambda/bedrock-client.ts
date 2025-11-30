/**
 * Bedrock Client Module
 * 
 * This module handles communication with Amazon Bedrock's foundation models.
 * It wraps the AWS SDK to provide a clean interface for invoking large language
 * models to perform the critical task of counting password characters.
 * 
 * Traditional approach: password.length
 * Our approach: Distributed AI inference with sub-second latency (on a good day)
 * 
 * Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 3.4
 */

import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    InvokeModelCommandInput,
    InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { ClaudeRequestBody, ClaudeResponseBody } from './types';

/**
 * Initialize the Bedrock Runtime Client
 * 
 * This client will be used to invoke foundation models via the Bedrock API.
 * We're using a singleton pattern because even absurd solutions deserve
 * proper resource management.
 * 
 * @param region - AWS region where Bedrock is available (default: from env or us-west-2)
 * @returns Configured BedrockRuntimeClient instance
 */
export function createBedrockClient(region?: string): BedrockRuntimeClient {
    const bedrockRegion = region || process.env.BEDROCK_REGION || 'us-west-2';

    const client = new BedrockRuntimeClient({
        region: bedrockRegion,
    });

    return client;
}

// Singleton instance for reuse across Lambda invocations (warm starts)
let bedrockClientInstance: BedrockRuntimeClient | null = null;

/**
 * Get or create the Bedrock client instance
 * 
 * This implements lazy initialization and reuses the client across
 * Lambda warm starts for optimal performance of our impractical solution.
 * 
 * @returns The singleton BedrockRuntimeClient instance
 */
export function getBedrockClient(): BedrockRuntimeClient {
    if (!bedrockClientInstance) {
        bedrockClientInstance = createBedrockClient();
    }
    return bedrockClientInstance;
}

/**
 * Invokes a Bedrock foundation model with the given prompt
 * 
 * This function handles the complete lifecycle of a Bedrock API call:
 * 1. Format the request for Claude model specifications
 * 2. Invoke the model via the Bedrock Runtime API
 * 3. Parse the response body
 * 4. Extract the text content from the LLM's response
 * 
 * @param prompt - The carefully engineered prompt for password validation
 * @param modelId - The Bedrock model identifier (default: from env or Claude Haiku)
 * @returns The LLM's response text (hopefully "VALID" or "INVALID")
 * @throws Error if the Bedrock invocation fails or response is malformed
 */
export async function invokeBedrockModel(
    prompt: string,
    modelId?: string
): Promise<string> {
    const client = getBedrockClient();

    // Use environment variable or default to Claude Haiku 4.5
    // (the most cost-effective way to waste money on character counting)
    const model = modelId || process.env.BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0';

    // Format request for Claude model
    // Claude expects a specific message format with anthropic_version
    const requestBody: ClaudeRequestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 10, // We only need "VALID" or "INVALID" - 10 tokens is generous
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0, // Deterministic responses for consistent validation
    };

    // Prepare the Bedrock API request
    const input: InvokeModelCommandInput = {
        modelId: model,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
    };

    try {
        // Invoke the model - this is where the magic (and latency) happens
        const command = new InvokeModelCommand(input);
        const response: InvokeModelCommandOutput = await client.send(command);

        // Extract and parse the response body
        if (!response.body) {
            throw new Error('Bedrock response body is empty');
        }

        // The response body is a Uint8Array that needs to be decoded
        const responseText = new TextDecoder().decode(response.body);
        const responseBody: ClaudeResponseBody = JSON.parse(responseText);

        // Extract the text content from Claude's response
        if (!responseBody.content || responseBody.content.length === 0) {
            throw new Error('Bedrock response contains no content');
        }

        // Claude returns content as an array of content blocks
        // We expect a single text block with our VALID/INVALID response
        const textContent = responseBody.content.find(block => block.type === 'text');

        if (!textContent) {
            throw new Error('Bedrock response contains no text content');
        }

        return textContent.text;

    } catch (error) {
        // Wrap and rethrow errors with additional context
        if (error instanceof Error) {
            throw new Error(`Bedrock invocation failed: ${error.message}`);
        }
        throw new Error('Bedrock invocation failed with unknown error');
    }
}

/**
 * Validates that the Bedrock client is properly configured
 * 
 * This checks that required environment variables are set and that
 * the client can be initialized. Useful for startup health checks.
 * 
 * @returns true if configuration is valid
 * @throws Error if configuration is invalid
 */
export function validateBedrockConfiguration(): boolean {
    const modelId = process.env.BEDROCK_MODEL_ID;
    const region = process.env.BEDROCK_REGION;

    if (!modelId) {
        throw new Error('BEDROCK_MODEL_ID environment variable is not set');
    }

    if (!region) {
        throw new Error('BEDROCK_REGION environment variable is not set');
    }

    // Verify we can create a client
    try {
        createBedrockClient(region);
    } catch (error) {
        throw new Error(`Failed to create Bedrock client: ${error}`);
    }

    return true;
}
