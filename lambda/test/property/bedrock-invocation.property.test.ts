/**
 * Property-Based Test: Bedrock Invocation Success
 * 
 * **Feature: ai-password-validator, Property 3: Bedrock invocation success**
 * 
 * This test verifies that for any valid prompt, the system should successfully
 * invoke the Bedrock API without throwing exceptions (assuming service availability).
 * 
 * **Validates: Requirements 1.4**
 * 
 * Property: For any valid prompt string, invokeBedrockModel should either:
 * 1. Return a string response (success case)
 * 2. Throw a specific error related to Bedrock service issues
 * 
 * The function should NOT throw errors for valid prompt inputs themselves.
 */

import * as fc from 'fast-check';
import { invokeBedrockModel, createBedrockClient } from '../../bedrock-client';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Mock the AWS SDK to avoid actual API calls during testing
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('Property Test: Bedrock Invocation Success', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Set up environment variables
        process.env.BEDROCK_MODEL_ID = 'anthropic.claude-haiku-4-5-20251001-v1:0';
        process.env.BEDROCK_REGION = 'us-west-2';
    });

    afterEach(() => {
        // Clean up environment variables
        delete process.env.BEDROCK_MODEL_ID;
        delete process.env.BEDROCK_REGION;
    });

    /**
     * Property: Valid prompts should invoke Bedrock without input-related errors
     * 
     * This property tests that the invokeBedrockModel function can handle
     * any valid prompt string without throwing errors due to the prompt itself.
     * 
     * We generate random prompts and verify that the function either:
     * - Successfully returns a response (mocked)
     * - Throws an error related to Bedrock service, not the prompt format
     */
    it('should successfully invoke Bedrock for any valid prompt string', async () => {
        // Mock the Bedrock client to return a successful response
        const mockSend = jest.fn().mockResolvedValue({
            body: new TextEncoder().encode(JSON.stringify({
                id: 'msg_test',
                type: 'message',
                role: 'assistant',
                content: [
                    {
                        type: 'text',
                        text: 'VALID'
                    }
                ],
                model: 'claude-3-haiku',
                stop_reason: 'end_turn',
                usage: {
                    input_tokens: 10,
                    output_tokens: 5
                }
            }))
        });

        (BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>).prototype.send = mockSend;

        // Generate arbitrary prompt strings
        const promptArbitrary = fc.string({ minLength: 1, maxLength: 1000 });

        await fc.assert(
            fc.asyncProperty(promptArbitrary, async (prompt) => {
                // The function should not throw errors for valid prompt inputs
                const result = await invokeBedrockModel(prompt);

                // Verify we got a string response
                expect(typeof result).toBe('string');

                // Verify the Bedrock client was called
                expect(mockSend).toHaveBeenCalled();

                // Verify the prompt was included in the request
                const callArgs = mockSend.mock.calls[mockSend.mock.calls.length - 1];
                const command = callArgs[0];
                const requestBody = JSON.parse(command.input.body);

                // The prompt should be in the messages array
                expect(requestBody.messages).toBeDefined();
                expect(requestBody.messages[0].content).toBe(prompt);
            }),
            { numRuns: 100 } // Run 100 iterations as specified in design doc
        );
    });

    /**
     * Property: Bedrock invocation should handle various prompt characteristics
     * 
     * This tests that prompts with different characteristics (special characters,
     * unicode, whitespace, etc.) are all handled correctly by the invocation logic.
     */
    it('should handle prompts with various characteristics without errors', async () => {
        const mockSend = jest.fn().mockResolvedValue({
            body: new TextEncoder().encode(JSON.stringify({
                id: 'msg_test',
                type: 'message',
                role: 'assistant',
                content: [{ type: 'text', text: 'VALID' }],
                model: 'claude-3-haiku',
                stop_reason: 'end_turn',
                usage: { input_tokens: 10, output_tokens: 5 }
            }))
        });

        (BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>).prototype.send = mockSend;

        // Generate prompts with various characteristics
        const specialPromptArbitrary = fc.oneof(
            fc.string({ minLength: 1 }), // Regular strings
            fc.string({ minLength: 1 }).map(s => s + '\n\n' + s), // Multi-line
            fc.string({ minLength: 1 }).map(s => '   ' + s + '   '), // With whitespace
            fc.string({ minLength: 1 }).map(s => s.repeat(3)), // Repeated content
            fc.string({ minLength: 1 }).map(s => s + '🔒🔑💻') // With emoji/unicode
        );

        await fc.assert(
            fc.asyncProperty(specialPromptArbitrary, async (prompt) => {
                const result = await invokeBedrockModel(prompt);

                // Should return a string without throwing
                expect(typeof result).toBe('string');
                expect(result.length).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Model ID parameter should be properly used in invocation
     * 
     * This verifies that when a custom model ID is provided, it's correctly
     * passed to the Bedrock API.
     */
    it('should use provided model ID in Bedrock invocation', async () => {
        const mockSend = jest.fn().mockResolvedValue({
            body: new TextEncoder().encode(JSON.stringify({
                id: 'msg_test',
                type: 'message',
                role: 'assistant',
                content: [{ type: 'text', text: 'VALID' }],
                model: 'claude-3-haiku',
                stop_reason: 'end_turn',
                usage: { input_tokens: 10, output_tokens: 5 }
            }))
        });

        (BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>).prototype.send = mockSend;

        // Generate arbitrary prompts and model IDs
        const testDataArbitrary = fc.record({
            prompt: fc.string({ minLength: 1, maxLength: 500 }),
            modelId: fc.constantFrom(
                'anthropic.claude-haiku-4-5-20251001-v1:0',
                'anthropic.claude-3-sonnet-20240229-v1:0',
                'anthropic.claude-v2:1'
            )
        });

        await fc.assert(
            fc.asyncProperty(testDataArbitrary, async ({ prompt, modelId }) => {
                await invokeBedrockModel(prompt, modelId);

                // Verify the correct model ID was used
                const callArgs = mockSend.mock.calls[mockSend.mock.calls.length - 1];
                const command = callArgs[0];

                expect(command.input.modelId).toBe(modelId);
            }),
            { numRuns: 100 }
        );
    });
});
