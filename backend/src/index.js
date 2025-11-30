import express from 'express';
import cors from 'cors';
import SockRepository from './repositories/SockRepository.js';
import SockService from './services/SockService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize repository and service
const sockRepository = new SockRepository();
const sockService = new SockService(sockRepository);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * POST /api/socks
 * Register a new sock
 * Request body: { color: string, size: string }
 * Response: { id: string, color: string, size: string }
 */
app.post('/api/socks', (req, res) => {
  try {
    const { color, size } = req.body;

    // Input validation
    if (!color || typeof color !== 'string' || color.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input: color is required and must be a non-empty string'
      });
    }

    if (!size || typeof size !== 'string' || size.trim() === '') {
      return res.status(400).json({
        error: 'Invalid input: size is required and must be a non-empty string'
      });
    }

    // Create sock using service
    const sock = sockService.createSock(color.trim(), size.trim());

    // Return sock without createdAt timestamp (as per API spec)
    res.status(201).json({
      id: sock.id,
      color: sock.color,
      size: sock.size
    });
  } catch (error) {
    console.error('Error creating sock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/socks/:id/matches
 * Get all matching socks for a given sock ID
 * Response: { matches: [{ id: string, color: string, size: string }, ...] }
 */
app.get('/api/socks/:id/matches', (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format (basic UUID validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid input: id must be a valid UUID'
      });
    }

    // Check if sock exists
    const sock = sockRepository.findById(id);
    if (!sock) {
      return res.status(404).json({
        error: 'Sock not found'
      });
    }

    // Find matches using service
    const matches = sockService.findMatches(id);

    // Return matches without createdAt timestamp (as per API spec)
    res.json({
      matches: matches.map(match => ({
        id: match.id,
        color: match.color,
        size: match.size
      }))
    });
  } catch (error) {
    console.error('Error finding matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
