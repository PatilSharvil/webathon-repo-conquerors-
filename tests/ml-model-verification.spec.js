/**
 * Playwright Test for ML Model Verification
 * 
 * This test verifies the ML model works correctly by:
 * 1. Running the Python test script
 * 2. Validating the output
 * 3. Checking model files exist
 */

import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test.describe('ML Risk Assessment Model Verification', () => {
  
  test('should have all required ML model files', () => {
    // Check that model files exist
    const modelPath = path.join(rootDir, 'ml_model', 'risk_assessment_model.pkl');
    const metadataPath = path.join(rootDir, 'ml_model', 'model_metadata.json');
    const dataPath = path.join(rootDir, 'ml_model', 'synthetic_risk_data.csv');
    
    expect(fs.existsSync(modelPath)).toBeTruthy();
    expect(fs.existsSync(metadataPath)).toBeTruthy();
    expect(fs.existsSync(dataPath)).toBeTruthy();
    
    console.log('✅ All ML model files exist');
  });

  test('should have valid model metadata', () => {
    const metadataPath = path.join(rootDir, 'ml_model', 'model_metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    expect(metadata).toHaveProperty('model_type', 'RandomForestRegressor');
    expect(metadata).toHaveProperty('algorithm', 'Random Forest');
    expect(metadata).toHaveProperty('feature_columns');
    expect(metadata).toHaveProperty('metrics');
    
    // Should have 20 features
    expect(metadata.feature_columns.length).toBe(20);
    
    console.log('✅ Model metadata is valid');
    console.log('   Model Type:', metadata.model_type);
    console.log('   Features:', metadata.feature_columns.length);
  });

  test('should successfully run Python model tests', () => {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(rootDir, 'ml_model', 'test_model.py');
      
      const python = spawn('python', [pythonScript], {
        cwd: rootDir
      });
      
      let output = '';
      let errorOutput = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      python.on('close', (code) => {
        // Python script should exit with code 0
        expect(code).toBe(0);
        
        // Output should contain success message
        expect(output).toContain('Testing complete! Model is ready for production.');
        
        // Should have tested all 3 cases
        expect(output).toContain('Low Risk Seller');
        expect(output).toContain('Medium Risk Seller');
        expect(output).toContain('High Risk Seller');
        
        console.log('✅ Python model tests passed successfully');
        console.log('   Output length:', output.length, 'bytes');
        
        resolve();
      });
    });
  });

  test('should generate valid predictions with risk scores in range', () => {
    return new Promise((resolve, reject) => {
      const predictScript = path.join(rootDir, 'ml_model', 'predict_api.py');
      
      // Test with a sample property
      const testFeatures = {
        num_owners: 3,
        recent_transfers: 1,
        avg_transfer_interval: 8.0,
        has_inheritance: 0,
        num_active_loans: 1,
        num_closed_loans: 2,
        total_loan_amount: 300000,
        num_defaults: 0,
        loan_to_value: 0.4,
        num_active_disputes: 0,
        num_resolved_disputes: 1,
        dispute_severity: 2.0,
        has_legal_case: 0,
        dispute_age_days: 500,
        property_age: 20,
        property_area: 3000,
        location_risk: 5,
        has_clear_title: 1,
        zone_risk: 3,
        property_type: 'Residential'
      };
      
      const python = spawn('python', [predictScript, JSON.stringify(testFeatures)], {
        cwd: rootDir
      });
      
      let output = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', (code) => {
        expect(code).toBe(0);
        
        const result = JSON.parse(output);
        
        // Validate prediction structure
        expect(result).toHaveProperty('risk_score');
        expect(result).toHaveProperty('risk_level');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('feature_importance');
        
        // Risk score should be in valid range
        expect(result.risk_score).toBeGreaterThanOrEqual(0);
        expect(result.risk_score).toBeLessThanOrEqual(100);
        
        // Risk level should be valid
        expect(['Low', 'Medium', 'High', 'Critical']).toContain(result.risk_level);
        
        // Confidence should be reasonable
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
        
        console.log('✅ Prediction is valid');
        console.log('   Risk Score:', result.risk_score);
        console.log('   Risk Level:', result.risk_level);
        console.log('   Confidence:', result.confidence);
        
        resolve();
      });
    });
  });

  test('should have comprehensive dataset', () => {
    const dataPath = path.join(rootDir, 'ml_model', 'synthetic_risk_data.csv');
    const dataInfoPath = path.join(rootDir, 'ml_model', 'dataset_info.json');
    
    // Check dataset info
    const dataInfo = JSON.parse(fs.readFileSync(dataInfoPath, 'utf8'));
    
    expect(dataInfo).toHaveProperty('n_samples');
    expect(dataInfo).toHaveProperty('n_features');
    expect(dataInfo.n_samples).toBeGreaterThanOrEqual(1000);
    expect(dataInfo.n_features).toBe(20);
    
    // Check CSV file size
    const stats = fs.statSync(dataPath);
    expect(stats.size).toBeGreaterThan(100000); // Should be at least 100KB
    
    console.log('✅ Dataset is comprehensive');
    console.log('   Samples:', dataInfo.n_samples);
    console.log('   Features:', dataInfo.n_features);
    console.log('   File size:', (stats.size / 1024).toFixed(2), 'KB');
  });

  test('should have feature importance data', () => {
    const featureImportancePath = path.join(rootDir, 'ml_model', 'feature_importance.png');
    
    expect(fs.existsSync(featureImportancePath)).toBeTruthy();
    
    const stats = fs.statSync(featureImportancePath);
    expect(stats.size).toBeGreaterThan(10000); // Should be a real image
    
    console.log('✅ Feature importance visualization exists');
  });

  test('should have predictions analysis visualization', () => {
    const predictionsPath = path.join(rootDir, 'ml_model', 'predictions_analysis.png');
    
    expect(fs.existsSync(predictionsPath)).toBeTruthy();
    
    const stats = fs.statSync(predictionsPath);
    expect(stats.size).toBeGreaterThan(10000);
    
    console.log('✅ Predictions analysis visualization exists');
  });

  test('should handle edge cases gracefully', () => {
    return new Promise((resolve, reject) => {
      const predictScript = path.join(rootDir, 'ml_model', 'predict_api.py');
      
      // Test with minimal risk property
      const minimalRisk = {
        num_owners: 1,
        recent_transfers: 0,
        avg_transfer_interval: 20.0,
        has_inheritance: 0,
        num_active_loans: 0,
        num_closed_loans: 0,
        total_loan_amount: 0,
        num_defaults: 0,
        loan_to_value: 0.0,
        num_active_disputes: 0,
        num_resolved_disputes: 0,
        dispute_severity: 0.0,
        has_legal_case: 0,
        dispute_age_days: 2000,
        property_age: 5,
        property_area: 5000,
        location_risk: 2,
        has_clear_title: 1,
        zone_risk: 1,
        property_type: 'Residential'
      };
      
      const python = spawn('python', [predictScript, JSON.stringify(minimalRisk)], {
        cwd: rootDir
      });
      
      let output = '';
      
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', (code) => {
        expect(code).toBe(0);
        
        const result = JSON.parse(output);
        expect(result).toHaveProperty('risk_score');
        expect(result).toHaveProperty('risk_level');
        
        // Minimal risk should be Low
        expect(result.risk_level).toBe('Low');
        
        console.log('✅ Edge case handling works');
        console.log('   Minimal Risk Score:', result.risk_score);
        console.log('   Minimal Risk Level:', result.risk_level);
        
        resolve();
      });
    });
  });
});
