/**
 * AI-Powered Password Validator Lambda Handler
 * 
 * This is the main entry point for our revolutionary password validation system.
 * Instead of using password.length >= 8, we leverage cutting-edge AI technology
 * to count characters using a large language model.
 * 
 * Architecture:
 * 1. Extract password from Cognito Pre Sign-up event
 * 2. Build a sophisticated prompt for the LLM
 * 3. Invoke Amazon Bedrock to count characters
 * 4. Parse the AI's natural language response
 * 5. Accept or reject the sign-up based on AI wisdom
 * 
 * Cost: ~$0.001-0.01 per validation
 * Traditional cost: $0.00
 * Value added: Priceless (in terms of entertainment)
 * 
 * Requirements: 1.1, 1.2, 1.6
 */

import { PreSignUpTriggerEvent } from './types';
import { buildPasswordValidationPrompt } from './prompt-builder';
import { invokeBedrockModel } from './bedrock-client';
import { parseValidationResponse } from './response-parser';
import { withErrorHandling, logInfo, logError } from './error-handler';

/**
 * Lambda handler for Cognito Pre Sign-up trigger
 * 
 * This function is invoked by AWS Cognito before a user registration is completed.
 * It validates the password using AI and either allows or rejects the sign-up.
 * 
 * @param event - Cognito Pre Sign-up trigger event containing user details and password
 * @returns The event object if validation succeeds
 * @throws Error if password validation fails (prevents sign-up)
 * 
 * Flow:
 * 1. Extract password from event.request.password
 * 2. Get minimum length from environment variable (default: 8)
 * 3. Build prompt asking LLM to count characters
 * 4. Invoke Bedrock with the prompt
 * 5. Parse LLM response for VALID/INVALID
 * 6. Throw error if invalid (rejects sign-up)
 * 7. Return event if valid (allows sign-up)
 */
export async function handler(event: PreSignUpTriggerEvent): Promise<PreSignUpTriggerEvent> {
    logInfo('AI-powered password validation started', {
        userName: event.userName,
        userPoolId: event.userPoolId,
        triggerSource: event.triggerSource,
    });

    try {
        // Step 1: Extract password from Cognito event
        // Requirements: 1.2
        const password = event.request.password;

        if (!password) {
            logError('Password not found in event', new Error('Missing password'), {
                eventStructure: JSON.stringify(event.request),
            });
            throw new Error('Password is required for validation');
        }

        logInfo('Password extracted from event', {
            passwordLength: password.length, // We know the answer, but let's ask AI anyway
        });

        // Step 2: Get minimum password length from environment
        const minLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '8', 10);

        logInfo('Minimum password length configured', {
            minLength,
        });

        // Step 3: Build prompt for LLM
        // Requirements: 1.3
        logInfo('Building AI prompt for password validation');
        const prompt = buildPasswordValidationPrompt(password, minLength);

        logInfo('Prompt constructed', {
            promptLength: prompt.length,
        });

        // Step 4: Invoke Bedrock with error handling and retries
        // Requirements: 1.4
        logInfo('Invoking Amazon Bedrock for AI-powered character counting');

        const llmResponse = await withErrorHandling(
            () => invokeBedrockModel(prompt),
            'Bedrock password validation'
        );

        logInfo('Received response from AI', {
            responseLength: llmResponse.length,
            responsePreview: llmResponse.substring(0, 50),
        });

        // Step 5: Parse LLM response
        // Requirements: 1.5
        logInfo('Parsing AI response');
        const isValid = parseValidationResponse(llmResponse);

        logInfo('AI validation complete', {
            isValid,
            llmResponse: llmResponse.substring(0, 100),
        });

        // Step 6: Handle validation result
        if (!isValid) {
            // Requirements: 1.6
            logInfo('Password rejected by AI', {
                userName: event.userName,
                reason: 'Password does not meet minimum length requirement (as determined by AI)',
            });

            throw new Error(
                `Password does not meet length requirements. ` +
                `The AI has determined that your password does not have at least ${minLength} characters. ` +
                `Please choose a longer password.`
            );
        }

        // Step 7: Password is valid, allow sign-up to proceed
        logInfo('Password validated successfully by AI', {
            userName: event.userName,
        });

        // Return the event unchanged to allow sign-up
        return event;

    } catch (error) {
        // Log the error and rethrow
        // Cognito will interpret any thrown error as a sign-up rejection
        logError('Password validation failed', error as Error, {
            userName: event.userName,
            userPoolId: event.userPoolId,
        });

        // Rethrow the error to reject the sign-up
        throw error;
    }
}

/**
 * Validates password using AI (convenience function for testing)
 * 
 * This function encapsulates the core validation logic and can be
 * used independently for testing purposes.
 * 
 * @param password - The password to validate
 * @param minLength - Minimum required length (default: 8)
 * @returns true if password is valid, false otherwise
 */
export async function validatePasswordWithAI(
    password: string,
    minLength: number = 8
): Promise<boolean> {
    const prompt = buildPasswordValidationPrompt(password, minLength);
    const llmResponse = await invokeBedrockModel(prompt);
    return parseValidationResponse(llmResponse);
}

/**
 * Health check function to verify Lambda configuration
 * 
 * This can be called during Lambda initialization to fail fast
 * if configuration is invalid.
 * 
 * @returns true if configuration is valid
 * @throws Error if configuration is invalid
 */
export function validateConfiguration(): boolean {
    const requiredEnvVars = [
        'BEDROCK_MODEL_ID',
        'MIN_PASSWORD_LENGTH',
        'BEDROCK_REGION',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }

    const minLength = parseInt(process.env.MIN_PASSWORD_LENGTH || '0', 10);
    if (isNaN(minLength) || minLength < 0) {
        throw new Error(
            `Invalid MIN_PASSWORD_LENGTH: ${process.env.MIN_PASSWORD_LENGTH}`
        );
    }

    logInfo('Lambda configuration validated successfully', {
        bedrockModelId: process.env.BEDROCK_MODEL_ID,
        minPasswordLength: minLength,
        bedrockRegion: process.env.BEDROCK_REGION,
    });

    return true;
}

// Validate configuration on Lambda initialization (cold start)
// This ensures we fail fast if configuration is invalid
try {
    validateConfiguration();
} catch (error) {
    logError('Lambda configuration validation failed', error as Error);
    // Don't throw here - let the handler throw when invoked
    // This allows CloudFormation deployment to succeed even if env vars aren't set yet
}
