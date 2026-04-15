/**
 * ML Risk Assessment Service Integration
 * 
 * Integrates the trained Random Forest model with the Express backend
 * Uses Python subprocess to make predictions
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLRiskService {
  constructor() {
    this.modelPath = path.join(__dirname, '..', 'ml_model', 'risk_assessment_model.pkl');
    this.metadataPath = path.join(__dirname, '..', 'ml_model', 'model_metadata.json');
    this.predictorScript = path.join(__dirname, '..', 'ml_model', 'predict_api.py');
    this.isAvailable = false;
    
    // Check if model exists
    this.checkModelAvailability();
  }

  /**
   * Check if the ML model files are available
   */
  checkModelAvailability() {
    if (fs.existsSync(this.modelPath) && fs.existsSync(this.metadataPath)) {
      this.isAvailable = true;
      console.log('✅ ML Risk Assessment Model loaded successfully');
    } else {
      this.isAvailable = false;
      console.warn('⚠️  ML Risk Assessment Model not found. Run Python training script first.');
    }
  }

  /**
   * Predict risk for a property based on its features
   * 
   * @param {Object} propertyData - Property data from MongoDB
   * @returns {Promise<Object>} Prediction result with risk_score and risk_level
   */
  async predictPropertyRisk(propertyData) {
    if (!this.isAvailable) {
      throw new Error('ML model not available. Please train the model first.');
    }

    // Extract features from property data
    const features = this.extractFeatures(propertyData);
    
    return new Promise((resolve, reject) => {
      // Call Python prediction script
      const python = spawn('python', [this.predictorScript, JSON.stringify(features)]);
      
      let result = '';
      let error = '';
      
      python.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const prediction = JSON.parse(result);
            resolve(prediction);
          } catch (e) {
            reject(new Error(`Failed to parse prediction result: ${result}`));
          }
        } else {
          reject(new Error(`Prediction failed: ${error}`));
        }
      });
    });
  }

  /**
   * Extract features from property data to match model input
   */
  extractFeatures(propertyData) {
    const now = new Date();
    
    // Ownership features
    const numOwners = propertyData.ownershipHistory?.length || 1;
    const recentTransfers = propertyData.ownershipHistory?.filter(oh => {
      const transferDate = new Date(oh.transferDate);
      const yearsDiff = (now - transferDate) / (1000 * 60 * 60 * 24 * 365);
      return yearsDiff <= 5;
    }).length || 0;
    
    // Calculate average transfer interval
    let avgTransferInterval = 10; // default
    if (propertyData.ownershipHistory?.length > 1) {
      const dates = propertyData.ownershipHistory.map(oh => new Date(oh.transferDate).getTime());
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24 * 365));
      }
      avgTransferInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
    
    const hasInheritance = propertyData.ownershipHistory?.some(oh => oh.transferType === 'inheritance') ? 1 : 0;
    
    // Loan features
    const activeLoans = propertyData.loans?.filter(l => l.status === 'active') || [];
    const closedLoans = propertyData.loans?.filter(l => l.status === 'closed') || [];
    const numActiveLoans = activeLoans.length;
    const numClosedLoans = closedLoans.length;
    const totalLoanAmount = activeLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const numDefaults = 0; // Would need additional data to determine defaults
    const loanToValue = totalLoanAmount / (propertyData.area * 1000) || 0.5; // Simplified LTV
    
    // Dispute features
    const activeDisputes = propertyData.disputes?.filter(d => d.status === 'active' || d.status === 'pending') || [];
    const resolvedDisputes = propertyData.disputes?.filter(d => d.status === 'resolved') || [];
    const numActiveDisputes = activeDisputes.length;
    const numResolvedDisputes = resolvedDisputes.length;
    
    // Calculate dispute severity (simplified)
    let disputeSeverity = 0;
    if (activeDisputes.length > 0) {
      const severityMap = {
        'boundary': 7,
        'ownership': 9,
        'financial': 6,
        'zoning': 5,
        'environmental': 8,
        'other': 4
      };
      const severities = activeDisputes.map(d => severityMap[d.type] || 5);
      disputeSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
    }
    
    const hasLegalCase = activeDisputes.some(d => d.type === 'ownership' || d.type === 'boundary') ? 1 : 0;
    
    // Calculate dispute age
    let disputeAgeDays = 1000;
    if (activeDisputes.length > 0 && activeDisputes[0].filedDate) {
      const oldestDispute = new Date(activeDisputes[0].filedDate);
      disputeAgeDays = (now - oldestDispute) / (1000 * 60 * 60 * 24);
    }
    
    // Property features
    const propertyAge = now.getFullYear() - (propertyData.metadata?.yearBuilt || 2000);
    const propertyArea = propertyData.area || 1000;
    
    // Location risk (simplified - could be enhanced with external data)
    const locationRisk = 5; // Default medium risk
    
    const hasClearTitle = propertyData.metadata?.clearTitle ? 1 : 0;
    const zoneRisk = propertyData.metadata?.zoneClassification ? 
      { 'residential': 2, 'commercial': 3, 'industrial': 4, 'agricultural': 2 }[propertyData.metadata.zoneClassification] || 3 
      : 3;
    
    const propertyType = propertyData.landType || 'Residential';
    
    return {
      num_owners: numOwners,
      recent_transfers: recentTransfers,
      avg_transfer_interval: parseFloat(avgTransferInterval.toFixed(2)),
      has_inheritance: hasInheritance,
      num_active_loans: numActiveLoans,
      num_closed_loans: numClosedLoans,
      total_loan_amount: totalLoanAmount,
      num_defaults: numDefaults,
      loan_to_value: parseFloat(loanToValue.toFixed(4)),
      num_active_disputes: numActiveDisputes,
      num_resolved_disputes: numResolvedDisputes,
      dispute_severity: parseFloat(disputeSeverity.toFixed(2)),
      has_legal_case: hasLegalCase,
      dispute_age_days: parseFloat(disputeAgeDays.toFixed(2)),
      property_age: propertyAge,
      property_area: propertyArea,
      location_risk: locationRisk,
      has_clear_title: hasClearTitle,
      zone_risk: zoneRisk,
      property_type: propertyType
    };
  }

  /**
   * Batch predict risk for multiple properties
   */
  async batchPredict(propertyDataList) {
    const predictions = [];
    
    for (const property of propertyDataList) {
      try {
        const prediction = await this.predictPropertyRisk(property);
        predictions.push({
          propertyId: property._id,
          surveyNumber: property.surveyNumber,
          ...prediction
        });
      } catch (error) {
        console.error(`Error predicting risk for property ${property.surveyNumber}:`, error.message);
        predictions.push({
          propertyId: property._id,
          surveyNumber: property.surveyNumber,
          error: error.message
        });
      }
    }
    
    return predictions;
  }

  /**
   * Get model metadata
   */
  getModelMetadata() {
    if (!fs.existsSync(this.metadataPath)) {
      throw new Error('Model metadata not found');
    }
    
    return JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
  }
}

// Create singleton instance
const mlRiskService = new MLRiskService();

export default mlRiskService;
