/**
 * @typedef {Object} Sock
 * @property {string} id - Unique identifier (UUID)
 * @property {string} color - Color of the sock (e.g., "red", "blue", "black")
 * @property {string} size - Size of the sock (e.g., "small", "medium", "large")
 * @property {Date} createdAt - Timestamp when sock was registered
 */

/**
 * Creates a new Sock object
 * @param {string} id - Unique identifier
 * @param {string} color - Color of the sock
 * @param {string} size - Size of the sock
 * @returns {Sock}
 */
export function createSock(id, color, size) {
  return {
    id,
    color,
    size,
    createdAt: new Date()
  };
}
