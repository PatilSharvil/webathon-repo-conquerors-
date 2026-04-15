import express from 'express';
import Property from '../models/Property.js';
import RiskAssessment from '../models/RiskAssessment.js';
import mlRiskService from '../services/mlRiskService.js';

const router = express.Router();

/**
 * POST /api/ml-risk/predict/:propertyId
 * 
 * Use ML model to predict risk for a specific property
 */
router.post('/predict/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Find property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Check if ML service is available
    if (!mlRiskService.isAvailable) {
      return res.status(503).json({ 
        error: 'ML model not available',
        message: 'Please train the ML model first by running: python ml_model/train_model.py'
      });
    }
    
    // Make prediction
    const prediction = await mlRiskService.predictPropertyRisk(property);
    
    // Save or update risk assessment
    let riskAssessment = await RiskAssessment.findOne({ propertyId });
    
    if (riskAssessment) {
      // Update existing assessment
      riskAssessment.score = prediction.risk_score;
      riskAssessment.riskLevel = prediction.risk_level;
      riskAssessment.factors.push({
        type: 'ml_prediction',
        severity: prediction.risk_level.toLowerCase(),
        description: `ML model prediction with ${prediction.confidence}% confidence`,
        evidence: 'Random Forest ML Model'
      });
      await riskAssessment.save();
    } else {
      // Create new assessment
      riskAssessment = new RiskAssessment({
        propertyId,
        score: prediction.risk_score,
        riskLevel: prediction.risk_level,
        factors: [{
          type: 'ml_prediction',
          severity: prediction.risk_level.toLowerCase(),
          description: `ML model prediction with ${prediction.confidence}% confidence`,
          evidence: 'Random Forest ML Model'
        }]
      });
      await riskAssessment.save();
    }
    
    res.json({
      success: true,
      propertyId,
      prediction,
      riskAssessmentId: riskAssessment._id
    });
    
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to make prediction',
      message: error.message 
    });
  }
});

/**
 * POST /api/ml-risk/batch-predict
 * 
 * Batch predict risk for multiple properties
 */
router.post('/batch-predict', async (req, res) => {
  try {
    const { propertyIds } = req.body;
    
    if (!propertyIds || !Array.isArray(propertyIds)) {
      return res.status(400).json({ error: 'propertyIds array is required' });
    }
    
    // Check if ML service is available
    if (!mlRiskService.isAvailable) {
      return res.status(503).json({ 
        error: 'ML model not available',
        message: 'Please train the ML model first'
      });
    }
    
    // Fetch properties
    const properties = await Property.find({ _id: { $in: propertyIds } });
    
    if (properties.length === 0) {
      return res.status(404).json({ error: 'No properties found' });
    }
    
    // Make batch predictions
    const predictions = await mlRiskService.batchPredict(properties);
    
    res.json({
      success: true,
      count: predictions.length,
      predictions
    });
    
  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to make batch predictions',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-risk/metadata
 * 
 * Get ML model metadata and performance metrics
 */
router.get('/metadata', (req, res) => {
  try {
    const metadata = mlRiskService.getModelMetadata();
    
    res.json({
      success: true,
      metadata
    });
    
  } catch (error) {
    res.status(404).json({ 
      error: 'Model metadata not found',
      message: error.message 
    });
  }
});

/**
 * GET /api/ml-risk/status
 * 
 * Check ML model availability status
 */
router.get('/status', (req, res) => {
  res.json({
    available: mlRiskService.isAvailable,
    message: mlRiskService.isAvailable 
      ? 'ML model is loaded and ready'
      : 'ML model not found. Run: python ml_model/train_model.py'
  });
});

export default router;
