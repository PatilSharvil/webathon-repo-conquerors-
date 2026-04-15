import express from 'express';
import riskEngine from '../services/riskEngine.js';

const router = express.Router();

router.get('/:propertyId', async (req, res) => {
  try {
    const assessment = await riskEngine.getAssessment(req.params.propertyId);
    if (!assessment) return res.status(404).json({ error: 'No assessment found' });
    res.json({ temporalData: assessment.temporalData, score: assessment.score, riskLevel: assessment.riskLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
