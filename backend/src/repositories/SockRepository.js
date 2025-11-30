/**
 * SockRepository - Manages in-memory storage of socks
 */
class SockRepository {
  constructor() {
    /** @type {Map<string, import('../models/Sock.js').Sock>} */
    this.socks = new Map();
  }

  /**
   * Save a sock to the repository
   * @param {import('../models/Sock.js').Sock} sock - The sock to save
   * @returns {import('../models/Sock.js').Sock} The saved sock
   */
  save(sock) {
    this.socks.set(sock.id, sock);
    return sock;
  }

  /**
   * Find a sock by its ID
   * @param {string} id - The sock ID to search for
   * @returns {import('../models/Sock.js').Sock | undefined} The sock if found, undefined otherwise
   */
  findById(id) {
    return this.socks.get(id);
  }

  /**
   * Find all socks matching the given color and size
   * @param {string} color - The color to match
   * @param {string} size - The size to match
   * @returns {import('../models/Sock.js').Sock[]} Array of matching socks
   */
  findByColorAndSize(color, size) {
    const matches = [];
    for (const sock of this.socks.values()) {
      if (sock.color === color && sock.size === size) {
        matches.push(sock);
      }
    }
    return matches;
  }

  /**
   * Get all socks in the repository
   * @returns {import('../models/Sock.js').Sock[]} Array of all socks
   */
  getAll() {
    return Array.from(this.socks.values());
  }

  /**
   * Clear all socks from the repository (useful for testing)
   */
  clear() {
    this.socks.clear();
  }
}

export default SockRepository;
