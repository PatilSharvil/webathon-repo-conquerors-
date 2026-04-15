import express from 'express';
import chatService from '../services/chatService.js';

const router = express.Router();

// Store conversation history per session
const sessions = new Map();

router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const sid = sessionId || `session_${Date.now()}`;

    // Get or create session history
    if (!sessions.has(sid)) {
      sessions.set(sid, []);
    }
    const history = sessions.get(sid);

    // Add user message
    history.push({ role: 'user', content: message });

    // Get AI response
    const result = await chatService.chat(message, sid);

    // Add AI response to history
    history.push({ role: 'assistant', content: result.answer });

    // Keep history manageable (last 20 messages)
    if (history.length > 20) {
      sessions.set(sid, history.slice(-20));
    }

    res.json({
      answer: result.answer,
      source: result.source,
      model: result.model || process.env.OLLAMA_MODEL || null,
      intent: result.intent || null,
      propertiesReferenced: result.propertiesReferenced,
      confidence: result.confidence,
      sessionId: sid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session history
router.get('/history/:sessionId', (req, res) => {
  const history = sessions.get(req.params.sessionId) || [];
  res.json({ history, sessionId: req.params.sessionId });
});

// Clear session
router.delete('/session/:sessionId', (req, res) => {
  sessions.delete(req.params.sessionId);
  res.json({ message: 'Session cleared' });
});

export default router;
