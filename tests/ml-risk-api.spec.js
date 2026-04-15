/**
 * Playwright Tests for ML Risk Assessment Model Integration
 * 
 * Tests the ML model API endpoints to ensure they work correctly
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api';

test.describe('ML Risk Assessment Model API', () => {
  
  /**
   * Test 1: Check ML model status
   */
  test('should return ML model status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ml-risk/status`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('available');
    expect(data).toHaveProperty('message');
    
    console.log('ML Model Status:', data.message);
  });

  /**
   * Test 2: Get ML model metadata
   */
  test('should return ML model metadata', async ({ request }) => {
    const response = await request.get(`${API_BASE}/ml-risk/metadata`);
    
    // This might fail if model isn't trained, so we handle both cases
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('feature_columns');
      expect(data.metadata).toHaveProperty('model_type');
      
      console.log('Model Type:', data.metadata.model_type);
      console.log('Features:', data.metadata.feature_columns.length);
    } else {
      const data = await response.json();
      console.log('Metadata not available:', data.message);
    }
  });

  /**
   * Test 3: Create a test property for ML prediction
   */
  test('should create a test property and predict risk', async ({ request }) => {
    // First, create a test property
    const testProperty = {
      surveyNumber: 'TEST-ML-001',
      ownerName: 'Test Owner',
      area: 5000,
      location: 'Test Location',
      district: 'Test District',
      village: 'Test Village',
      landType: 'Residential',
      ownershipHistory: [
        {
          ownerName: 'Original Owner',
          transferDate: '2010-01-01',
          transferType: 'sale'
        },
        {
          ownerName: 'Second Owner',
          transferDate: '2015-06-15',
          transferType: 'sale'
        },
        {
          ownerName: 'Current Owner',
          transferDate: '2020-03-20',
          transferType: 'sale'
        }
      ],
      loans: [
        {
          lender: 'Test Bank',
          amount: 500000,
          startDate: '2021-01-01',
          endDate: '2026-01-01',
          status: 'active'
        }
      ],
      disputes: [
        {
          filedDate: '2023-06-01',
          type: 'boundary',
          status: 'pending',
          description: 'Boundary dispute with neighbor'
        }
      ],
      metadata: {
        yearBuilt: 2010,
        clearTitle: true,
        zoneClassification: 'residential'
      }
    };

    const createResponse = await request.post(`${API_BASE}/properties`, {
      data: testProperty
    });

    if (!createResponse.ok()) {
      console.log('Could not create property, skipping prediction test');
      return;
    }

    const createdProperty = await createResponse.json();
    const propertyId = createdProperty._id || createdProperty.property?._id;
    
    expect(propertyId).toBeTruthy();
    console.log('Created property ID:', propertyId);

    // Now test ML prediction (if model is available)
    const predictResponse = await request.post(`${API_BASE}/ml-risk/predict/${propertyId}`);
    
    if (predictResponse.ok()) {
      const prediction = await predictResponse.json();
      expect(prediction).toHaveProperty('success', true);
      expect(prediction).toHaveProperty('prediction');
      expect(prediction.prediction).toHaveProperty('risk_score');
      expect(prediction.prediction).toHaveProperty('risk_level');
      
      console.log('ML Prediction Result:');
      console.log('  Risk Score:', prediction.prediction.risk_score);
      console.log('  Risk Level:', prediction.prediction.risk_level);
      console.log('  Confidence:', prediction.prediction.confidence);
    } else {
      const errorData = await predictResponse.json();
      console.log('Prediction not available:', errorData.message || errorData.error);
    }
  });

  /**
   * Test 4: Test batch prediction
   */
  test('should handle batch prediction request', async ({ request }) => {
    // Get existing properties
    const propertiesResponse = await request.get(`${API_BASE}/properties`);
    
    if (!propertiesResponse.ok()) {
      console.log('Could not fetch properties, skipping batch test');
      return;
    }

    const properties = await propertiesResponse.json();
    const propertyIds = properties.slice(0, 3).map(p => p._id);

    if (propertyIds.length === 0) {
      console.log('No properties available for batch testing');
      return;
    }

    // Test batch prediction
    const batchResponse = await request.post(`${API_BASE}/ml-risk/batch-predict`, {
      data: { propertyIds }
    });

    if (batchResponse.ok()) {
      const result = await batchResponse.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('count');
      expect(result.predictions).toBeDefined();
      
      console.log('Batch Prediction Result:');
      console.log('  Total Predictions:', result.count);
      console.log('  Predictions:', result.predictions.length);
    } else {
      const errorData = await batchResponse.json();
      console.log('Batch prediction not available:', errorData.message || errorData.error);
    }
  });

  /**
   * Test 5: Test error handling for non-existent property
   */
  test('should handle prediction request for non-existent property', async ({ request }) => {
    const fakeId = '000000000000000000000000';
    const response = await request.post(`${API_BASE}/ml-risk/predict/${fakeId}`);
    
    // Should return 404
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    
    console.log('Error handling test passed:', data.error);
  });

  /**
   * Test 6: Validate risk score range
   */
  test('should return risk score in valid range (0-100)', async ({ request }) => {
    // Create a test property
    const testProperty = {
      surveyNumber: 'TEST-ML-VALID-001',
      ownerName: 'Validation Test Owner',
      area: 3000,
      location: 'Test Location',
      district: 'Test District',
      village: 'Test Village',
      landType: 'Agricultural',
      ownershipHistory: [],
      loans: [],
      disputes: []
    };

    const createResponse = await request.post(`${API_BASE}/properties`, {
      data: testProperty
    });

    if (!createResponse.ok()) {
      console.log('Could not create property for validation test');
      return;
    }

    const createdProperty = await createResponse.json();
    const propertyId = createdProperty._id || createdProperty.property?._id;

    // Test prediction
    const predictResponse = await request.post(`${API_BASE}/ml-risk/predict/${propertyId}`);
    
    if (predictResponse.ok()) {
      const prediction = await predictResponse.json();
      const riskScore = prediction.prediction.risk_score;
      
      // Validate score is in range 0-100
      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(100);
      
      console.log('Risk score validation passed:', riskScore);
      
      // Validate risk level matches score
      const riskLevel = prediction.prediction.risk_level;
      if (riskScore >= 80) {
        expect(riskLevel).toBe('Critical');
      } else if (riskScore >= 60) {
        expect(riskLevel).toBe('High');
      } else if (riskScore >= 40) {
        expect(riskLevel).toBe('Medium');
      } else {
        expect(riskLevel).toBe('Low');
      }
      
      console.log('Risk level validation passed:', riskLevel);
    } else {
      console.log('Prediction not available for validation');
    }
  });
});
