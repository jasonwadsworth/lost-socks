import SockService from './SockService.js';
import SockRepository from '../repositories/SockRepository.js';

describe('SockService', () => {
  let sockService;
  let sockRepository;

  beforeEach(() => {
    sockRepository = new SockRepository();
    sockService = new SockService(sockRepository);
  });

  describe('createSock', () => {
    it('should create a sock with unique ID', () => {
      const sock = sockService.createSock('red', 'medium');

      expect(sock).toBeDefined();
      expect(sock.id).toBeDefined();
      expect(sock.color).toBe('red');
      expect(sock.size).toBe('medium');
      expect(sock.createdAt).toBeInstanceOf(Date);
    });

    it('should store the created sock in repository', () => {
      const sock = sockService.createSock('blue', 'large');
      const retrieved = sockRepository.findById(sock.id);

      expect(retrieved).toEqual(sock);
    });
  });

  describe('findMatches', () => {
    it('should return matching socks with same color and size', () => {
      const sock1 = sockService.createSock('red', 'medium');
      const sock2 = sockService.createSock('red', 'medium');
      const sock3 = sockService.createSock('blue', 'medium');

      const matches = sockService.findMatches(sock1.id);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(sock2.id);
    });

    it('should exclude the original sock from results', () => {
      const sock1 = sockService.createSock('red', 'medium');
      const sock2 = sockService.createSock('red', 'medium');

      const matches = sockService.findMatches(sock1.id);

      expect(matches.every(s => s.id !== sock1.id)).toBe(true);
    });

    it('should return empty array when no matches exist', () => {
      const sock1 = sockService.createSock('red', 'medium');
      const sock2 = sockService.createSock('blue', 'large');

      const matches = sockService.findMatches(sock1.id);

      expect(matches).toHaveLength(0);
    });

    it('should return empty array for non-existent sock ID', () => {
      const matches = sockService.findMatches('non-existent-id');

      expect(matches).toHaveLength(0);
    });

    it('should filter by both color and size', () => {
      const sock1 = sockService.createSock('red', 'medium');
      sockService.createSock('red', 'large'); // Different size
      sockService.createSock('blue', 'medium'); // Different color
      const sock4 = sockService.createSock('red', 'medium'); // Match

      const matches = sockService.findMatches(sock1.id);

      expect(matches).toHaveLength(1);
      expect(matches[0].id).toBe(sock4.id);
    });
  });
});
