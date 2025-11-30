/**
 * Error Handler Module
 * 
 * This module provides sophisticated error handling for our AI-powered
 * password validation system. Because even the most impractical solutions
 * deserve enterprise-grade error handling.
 * 
 * Features:
 * - Retry logic with exponential backoff
 * - Comprehensive error classification
 * - Detailed error logging
 * - Graceful degradation
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * Error types that can occur during password validation
 */
export enum ValidationErrorType {
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    TIMEOUT = 'TIMEOUT',
    MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
    THROTTLING = 'THROTTLING',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for password validation failures
 */
export class PasswordValidationError extends Error {
    public readonly type: ValidationErrorType;
    public readonly retryable: boolean;
    public readonly originalError?: Error;
    public readonly context?: Record<string, any>;

    constructor(
        message: string,
        type: ValidationErrorType,
        retryable: boolean = false,
        originalError?: Error,
        context?: Record<string, any>
    ) {
        super(message);
        this.name = 'PasswordValidationError';
        this.type = type;
        this.retryable = retryable;
        this.originalError = originalError;
        this.context = context;

        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, PasswordValidationError);
        }
    }
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
}

/**
 * Default retry configuration
 * - 3 retries with exponential backoff
 * - Initial delay: 100ms
 * - Delays: 100ms, 200ms, 400ms
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
};

/**
 * Classifies an error to determine its type and whether it's retryable
 * 
 * @param error - The error to classify
 * @returns Classification with error type and retry eligibility
 */
export function classifyError(error: any): {
    type: ValidationErrorType;
    retryable: boolean;
} {
    // Handle AWS SDK errors
    if (error.name === 'ServiceUnavailableException' || error.$metadata?.httpStatusCode === 503) {
        return { type: ValidationErrorType.SERVICE_UNAVAILABLE, retryable: true };
    }

    if (error.name === 'ThrottlingException' || error.$metadata?.httpStatusCode === 429) {
        return { type: ValidationErrorType.THROTTLING, retryable: true };
    }

    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        return { type: ValidationErrorType.TIMEOUT, retryable: true };
    }

    // Network errors are typically retryable
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ENETUNREACH') {
        return { type: ValidationErrorType.NETWORK_ERROR, retryable: true };
    }

    // Configuration errors are not retryable
    if (error.message?.includes('environment variable') || error.message?.includes('configuration')) {
        return { type: ValidationErrorType.CONFIGURATION_ERROR, retryable: false };
    }

    // Malformed response errors are not retryable
    if (error.message?.includes('parse') || error.message?.includes('VALID') || error.message?.includes('INVALID')) {
        return { type: ValidationErrorType.MALFORMED_RESPONSE, retryable: false };
    }

    // Default to unknown, non-retryable
    return { type: ValidationErrorType.UNKNOWN, retryable: false };
}

/**
 * Calculates the delay for a retry attempt using exponential backoff
 * 
 * @param attemptNumber - The current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
    attemptNumber: number,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);
    return Math.min(delay, config.maxDelayMs);
}

/**
 * Sleeps for the specified duration
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a function with retry logic and exponential backoff
 * 
 * This is the core retry mechanism that will attempt to execute the provided
 * function multiple times if it fails with a retryable error.
 * 
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws PasswordValidationError if all retries are exhausted
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            // Attempt to execute the function
            const result = await fn();

            // Log successful retry if this wasn't the first attempt
            if (attempt > 0) {
                logInfo(`Operation succeeded after ${attempt} retry attempt(s)`);
            }

            return result;
        } catch (error) {
            lastError = error;

            // Classify the error
            const { type, retryable } = classifyError(error);

            // Log the error
            logError(`Attempt ${attempt + 1}/${config.maxRetries + 1} failed`, error as Error, {
                errorType: type,
                retryable,
                attempt,
            });

            // If this is the last attempt or error is not retryable, throw
            if (attempt >= config.maxRetries || !retryable) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new PasswordValidationError(
                    `Operation failed after ${attempt + 1} attempt(s): ${errorMessage}`,
                    type,
                    false,
                    error instanceof Error ? error : undefined,
                    { attempts: attempt + 1, maxRetries: config.maxRetries }
                );
            }

            // Calculate backoff delay and wait
            const delay = calculateBackoffDelay(attempt, config);
            logInfo(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries})`);
            await sleep(delay);
        }
    }

    // This should never be reached, but TypeScript needs it
    throw new PasswordValidationError(
        'Retry logic exhausted',
        ValidationErrorType.UNKNOWN,
        false,
        lastError
    );
}

/**
 * Handles Bedrock service unavailable errors
 * 
 * @param error - The service unavailable error
 * @returns A user-friendly error message
 */
export function handleServiceUnavailable(error: any): never {
    logError('Bedrock service is unavailable', error, {
        errorType: ValidationErrorType.SERVICE_UNAVAILABLE,
    });

    throw new PasswordValidationError(
        'Password validation service is temporarily unavailable. Please try again later.',
        ValidationErrorType.SERVICE_UNAVAILABLE,
        true,
        error
    );
}

/**
 * Handles timeout errors
 * 
 * @param error - The timeout error
 * @returns A user-friendly error message
 */
export function handleTimeout(error: any): never {
    logError('Bedrock invocation timed out', error, {
        errorType: ValidationErrorType.TIMEOUT,
    });

    throw new PasswordValidationError(
        'Password validation timed out. Please try again.',
        ValidationErrorType.TIMEOUT,
        true,
        error
    );
}

/**
 * Handles malformed response errors
 * 
 * @param response - The malformed response
 * @param error - The parsing error
 * @returns A user-friendly error message
 */
export function handleMalformedResponse(response: string, error: any): never {
    logError('Unable to parse LLM response', error, {
        errorType: ValidationErrorType.MALFORMED_RESPONSE,
        response: response.substring(0, 200), // Log first 200 chars
    });

    throw new PasswordValidationError(
        'Unable to validate password format. The AI response was unexpected.',
        ValidationErrorType.MALFORMED_RESPONSE,
        false,
        error,
        { response: response.substring(0, 200) }
    );
}

/**
 * Handles network errors
 * 
 * @param error - The network error
 * @returns A user-friendly error message
 */
export function handleNetworkError(error: any): never {
    logError('Network error during Bedrock invocation', error, {
        errorType: ValidationErrorType.NETWORK_ERROR,
    });

    throw new PasswordValidationError(
        'Network error occurred during password validation. Please try again.',
        ValidationErrorType.NETWORK_ERROR,
        true,
        error
    );
}

/**
 * Logs an error with context
 * 
 * @param message - Error message
 * @param error - The error object
 * @param context - Additional context
 */
export function logError(message: string, error: any, context?: Record<string, any>): void {
    const logEntry = {
        level: 'ERROR',
        message,
        error: {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            statusCode: error?.$metadata?.httpStatusCode,
        },
        context,
        timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(logEntry));
}

/**
 * Logs an informational message
 * 
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(message: string, context?: Record<string, any>): void {
    const logLevel = process.env.LOG_LEVEL || 'INFO';

    if (logLevel === 'ERROR') {
        return; // Don't log info if log level is ERROR
    }

    const logEntry = {
        level: 'INFO',
        message,
        context,
        timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logEntry));
}

/**
 * Logs a warning message
 * 
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarning(message: string, context?: Record<string, any>): void {
    const logLevel = process.env.LOG_LEVEL || 'INFO';

    if (logLevel === 'ERROR') {
        return; // Don't log warnings if log level is ERROR
    }

    const logEntry = {
        level: 'WARNING',
        message,
        context,
        timestamp: new Date().toISOString(),
    };

    console.warn(JSON.stringify(logEntry));
}

/**
 * Wraps a function with comprehensive error handling
 * 
 * This is a convenience function that combines retry logic with
 * specific error handling for common scenarios.
 * 
 * @param fn - The async function to execute
 * @param operationName - Name of the operation for logging
 * @param config - Retry configuration
 * @returns The result of the function
 */
export async function withErrorHandling<T>(
    fn: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
    logInfo(`Starting operation: ${operationName}`);

    try {
        const result = await withRetry(fn, config);
        logInfo(`Operation completed successfully: ${operationName}`);
        return result;
    } catch (error) {
        // If it's already a PasswordValidationError, just rethrow
        if (error instanceof PasswordValidationError) {
            throw error;
        }

        // Classify and handle the error appropriately
        const { type } = classifyError(error);

        switch (type) {
            case ValidationErrorType.SERVICE_UNAVAILABLE:
                handleServiceUnavailable(error);
            case ValidationErrorType.TIMEOUT:
                handleTimeout(error);
            case ValidationErrorType.NETWORK_ERROR:
                handleNetworkError(error);
            case ValidationErrorType.MALFORMED_RESPONSE:
                handleMalformedResponse('', error);
            default:
                // Generic error handling
                logError(`Operation failed: ${operationName}`, error as Error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new PasswordValidationError(
                    `Password validation failed: ${errorMessage}`,
                    type,
                    false,
                    error instanceof Error ? error : undefined
                );
        }
    }
}
