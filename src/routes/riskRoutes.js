import express from 'express';
import riskEngine from '../services/riskEngine.js';

const router = express.Router();

router.post('/assess/:propertyId', async (req, res) => {
  try {
    const assessment = await riskEngine.assess(req.params.propertyId);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:propertyId', async (req, res) => {
  try {
    const assessment = await riskEngine.getAssessment(req.params.propertyId);
    if (!assessment) return res.status(404).json({ error: 'No assessment found' });
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
