/**
 * Response Parser Module
 * 
 * This module parses natural language responses from large language models
 * to extract password validation results. It searches for the keywords
 * "VALID" or "INVALID" in the LLM's response.
 * 
 * Traditional approach: return password.length >= 8
 * Our approach: Parse unstructured text from a neural network
 * 
 * Requirements: 1.5, 3.5
 */

/**
 * Parses an LLM response to determine password validation result
 * 
 * This function searches for the keywords "VALID" or "INVALID" in the
 * LLM's response text. It handles case-insensitive matching because
 * even AI models sometimes forget to follow instructions.
 * 
 * The function prioritizes finding "INVALID" first to handle edge cases
 * where the LLM might say something like "The password is INVALID, not VALID"
 * 
 * @param response - The natural language response from the LLM
 * @returns true if password is VALID, false if INVALID
 * @throws Error if neither keyword is found in the response
 * 
 * @example
 * parseValidationResponse("VALID") // returns true
 * parseValidationResponse("The password is INVALID") // returns false
 * parseValidationResponse("valid") // returns true (case-insensitive)
 */
export function parseValidationResponse(response: string): boolean {
    // Validate input
    if (response === null || response === undefined) {
        throw new Error('Response cannot be null or undefined');
    }

    if (typeof response !== 'string') {
        throw new Error('Response must be a string');
    }

    // Convert to uppercase for case-insensitive matching
    const upperResponse = response.toUpperCase();

    // Check for INVALID first to handle cases where both words might appear
    // Example: "The password is INVALID, not VALID"
    if (upperResponse.includes('INVALID')) {
        return false;
    }

    // Check for VALID
    if (upperResponse.includes('VALID')) {
        return true;
    }

    // If neither keyword is found, throw an error
    // This indicates the LLM didn't follow our carefully crafted instructions
    throw new Error(
        `Unable to parse validation response. Expected "VALID" or "INVALID" but got: "${response}"`
    );
}

/**
 * Attempts to extract additional information from the LLM response
 * 
 * Sometimes the LLM provides helpful context like the actual character count.
 * This function attempts to extract that information for logging purposes.
 * 
 * @param response - The natural language response from the LLM
 * @returns An object with parsed information
 */
export function extractValidationDetails(response: string): {
    isValid: boolean;
    characterCount?: number;
    rawResponse: string;
} {
    const isValid = parseValidationResponse(response);

    // Try to extract character count using regex
    // Matches patterns like "8 characters", "has 12 characters", "count: 5"
    const countMatch = response.match(/(\d+)\s*characters?/i) ||
        response.match(/count[:\s]+(\d+)/i) ||
        response.match(/has\s+(\d+)/i);

    const characterCount = countMatch ? parseInt(countMatch[1], 10) : undefined;

    return {
        isValid,
        characterCount,
        rawResponse: response,
    };
}

/**
 * Validates that a response string is suitable for parsing
 * 
 * This checks for common issues that might cause parsing to fail.
 * 
 * @param response - The response to validate
 * @returns true if the response is valid for parsing
 * @throws Error if the response is invalid
 */
export function validateResponse(response: string): boolean {
    if (response === null || response === undefined) {
        throw new Error('Response cannot be null or undefined');
    }

    if (typeof response !== 'string') {
        throw new Error('Response must be a string');
    }

    if (response.trim().length === 0) {
        throw new Error('Response cannot be empty or whitespace only');
    }

    return true;
}

/**
 * Parses a validation response with full error handling
 * 
 * This is the "production-ready" version that validates the response
 * before attempting to parse it. Because even over-engineered solutions
 * need proper error handling.
 * 
 * @param response - The LLM response to parse
 * @returns true if password is VALID, false if INVALID
 * @throws Error if response is invalid or cannot be parsed
 */
export function parseValidatedResponse(response: string): boolean {
    validateResponse(response);
    return parseValidationResponse(response);
}
