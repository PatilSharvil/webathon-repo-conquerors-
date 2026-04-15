import express from 'express';
import axios from 'axios';
import Property from '../models/Property.js';

const router = express.Router();

router.post('/semantic', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    // Try Ollama for semantic understanding
    let searchFilters = {};
    try {
      const ollamaResponse = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        prompt: `Extract search filters from this property query. Return JSON only with keys: surveyNumber, location, district, landType, riskLevel (low/medium/high/critical/any). Query: "${query}"`,
        stream: false
      });
      
      const extracted = JSON.parse(ollamaResponse.data.response.replace(/```json\n?|\n?```/g, '').trim());
      if (extracted.surveyNumber) searchFilters.surveyNumber = { $regex: extracted.surveyNumber, $options: 'i' };
      if (extracted.location) searchFilters.location = { $regex: extracted.location, $options: 'i' };
      if (extracted.district) searchFilters.district = { $regex: extracted.district, $options: 'i' };
    } catch (ollamaError) {
      // Fallback to keyword search if Ollama unavailable
      console.log('Ollama unavailable, using keyword search');
      const keywords = query.toLowerCase().split(' ');
      const orConditions = [];
      keywords.forEach(kw => {
        ['surveyNumber', 'ownerName', 'location', 'district'].forEach(field => {
          const filter = {};
          filter[field] = { $regex: kw, $options: 'i' };
          orConditions.push(filter);
        });
      });
      searchFilters = { $or: orConditions };
    }

    const properties = await Property.find(searchFilters).limit(20);
    res.json({ query, results: properties, count: properties.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
