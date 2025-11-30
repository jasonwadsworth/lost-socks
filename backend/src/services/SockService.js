import { v4 as uuidv4 } from 'uuid';
import { createSock } from '../models/Sock.js';

/**
 * SockService - Business logic for sock operations
 */
class SockService {
  /**
   * @param {import('../repositories/SockRepository.js').default} sockRepository
   */
  constructor(sockRepository) {
    this.sockRepository = sockRepository;
  }

  /**
   * Create a new sock and store it in the repository
   * @param {string} color - Color of the sock
   * @param {string} size - Size of the sock
   * @returns {import('../models/Sock.js').Sock} The created sock with unique ID
   */
  createSock(color, size) {
    const id = uuidv4();
    const sock = createSock(id, color, size);
    return this.sockRepository.save(sock);
  }

  /**
   * Find all matching socks for a given sock ID
   * Matches are socks with the same color and size, excluding the original sock
   * @param {string} sockId - The ID of the sock to find matches for
   * @returns {import('../models/Sock.js').Sock[]} Array of matching socks (excluding the original)
   */
  findMatches(sockId) {
    const originalSock = this.sockRepository.findById(sockId);

    if (!originalSock) {
      return [];
    }

    const allMatches = this.sockRepository.findByColorAndSize(
      originalSock.color,
      originalSock.size
    );

    // Filter out the original sock from the results
    return allMatches.filter(sock => sock.id !== sockId);
  }
}

export default SockService;
