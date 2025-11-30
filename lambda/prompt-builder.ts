/**
 * Prompt Builder Module
 * 
 * This module constructs carefully engineered prompts for Amazon Bedrock
 * to perform the sophisticated task of counting characters in a password.
 * 
 * Traditional approach: password.length >= 8
 * Our approach: Send password to a billion-parameter neural network
 * 
 * Requirements: 1.3, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5
 */

/**
 * Builds a meticulously crafted prompt for password validation
 * 
 * This function creates a prompt that instructs a large language model
 * to count the number of characters in a password and determine if it
 * meets the minimum length requirement.
 * 
 * @param password - The password to validate (will be sent to AI for counting)
 * @param minLength - Minimum required password length (default: 8)
 * @returns A prompt string ready for LLM consumption
 * 
 * @example
 * const prompt = buildPasswordValidationPrompt("mypass123", 8);
 * // Returns a prompt asking the LLM to count characters
 */
export function buildPasswordValidationPrompt(
    password: string,
    minLength: number = 8
): string {
    // Construct the most elaborate prompt possible for the simplest task
    const prompt = `You are a password validation system with expertise in character counting and length analysis.

Your task is to count the exact number of characters in a password and determine if it meets the minimum length requirement.

PASSWORD TO VALIDATE: "${password}"
MINIMUM REQUIRED LENGTH: ${minLength} characters

INSTRUCTIONS:
1. Count the EXACT number of characters in the password provided above
2. Each character counts as one, including letters, numbers, symbols, and spaces
3. Compare the character count to the minimum required length (${minLength})
4. Determine if the password meets or exceeds the minimum length requirement

RESPONSE FORMAT:
You must respond with ONLY one of these two words:
- "VALID" if the password has ${minLength} or more characters
- "INVALID" if the password has fewer than ${minLength} characters

Do not include any explanation, reasoning, or additional text in your response.
Respond with only the single word: VALID or INVALID

Your response:`;

    return prompt;
}

/**
 * Validates that a password string is suitable for prompt construction
 * 
 * This ensures we don't send problematic inputs to the LLM.
 * Because even over-engineered solutions need input validation.
 * 
 * @param password - The password to validate
 * @returns true if the password is valid for prompt construction
 * @throws Error if the password is null, undefined, or not a string
 */
export function validatePasswordInput(password: string): boolean {
    if (password === null || password === undefined) {
        throw new Error('Password cannot be null or undefined');
    }

    if (typeof password !== 'string') {
        throw new Error('Password must be a string');
    }

    // Even empty passwords are valid inputs - the LLM will count them as 0 characters
    return true;
}

/**
 * Validates that the minimum length parameter is reasonable
 * 
 * @param minLength - The minimum length to validate
 * @returns true if the minimum length is valid
 * @throws Error if the minimum length is invalid
 */
export function validateMinLength(minLength: number): boolean {
    if (typeof minLength !== 'number') {
        throw new Error('Minimum length must be a number');
    }

    if (minLength < 0) {
        throw new Error('Minimum length cannot be negative');
    }

    if (!Number.isInteger(minLength)) {
        throw new Error('Minimum length must be an integer');
    }

    if (minLength > 1000) {
        throw new Error('Minimum length is unreasonably large (max: 1000)');
    }

    return true;
}

/**
 * Builds a password validation prompt with full input validation
 * 
 * This is the "production-ready" version that validates all inputs
 * before constructing the prompt. Because we're professionals.
 * 
 * @param password - The password to validate
 * @param minLength - Minimum required password length (default: 8)
 * @returns A validated prompt string
 * @throws Error if inputs are invalid
 */
export function buildValidatedPasswordPrompt(
    password: string,
    minLength: number = 8
): string {
    validatePasswordInput(password);
    validateMinLength(minLength);

    return buildPasswordValidationPrompt(password, minLength);
}
