# ML Risk Assessment Model - Deployment Guide

## Overview

This document provides instructions for deploying the ML-based Risk Assessment model to production.

## What Was Built

### 1. **Synthetic Data Generator** (`ml_model/generate_synthetic_data.py`)
- Generates 2,000 samples of seller/property data
- Features: ownership history, loans, disputes, property characteristics
- Creates balanced risk score distribution across Low/Medium/High/Critical levels

### 2. **ML Model** (Random Forest Regressor)
- **Algorithm**: Random Forest Regressor
- **Performance**: R² = 0.67 on test set
- **Features**: 20 input features
- **Output**: Risk score (0-100) + risk level classification

### 3. **Integration Layer**
- Node.js service (`src/services/mlRiskService.js`)
- Express routes (`src/routes/mlRiskRoutes.js`)
- Python prediction API (`ml_model/predict_api.py`)

### 4. **Testing**
- Playwright test suite (8 tests, all passing)
- Model verification tests
- Edge case handling

## Files Added

```
ml_model/
├── generate_synthetic_data.py    # Data generation script
├── train_model.py                # Model training pipeline
├── test_model.py                 # Model testing & predictions
├── predict_api.py                # Python API for Node.js integration
├── requirements.txt              # Python dependencies
├── README.md                     # ML model documentation
├── risk_assessment_model.pkl     # Trained model (binary)
├── model_metadata.json           # Model metadata
├── synthetic_risk_data.csv       # Training dataset
├── dataset_info.json             # Dataset information
├── feature_importance.png        # Feature importance plot
└── predictions_analysis.png      # Prediction analysis plot

src/
├── services/mlRiskService.js     # ML service integration
└── routes/mlRiskRoutes.js        # Express API routes

tests/
├── ml-model-verification.spec.js # Playwright model tests
└── ml-risk-api.spec.js           # API endpoint tests

playwright.config.js              # Playwright configuration
```

## Deployment Steps

### Step 1: Install Python Dependencies

```bash
cd ml_model
pip install -r requirements.txt
```

**Required packages:**
- scikit-learn>=1.3.0
- pandas>=2.0.0
- numpy>=1.24.0
- matplotlib>=3.7.0
- seaborn>=0.12.0
- joblib>=1.3.0

### Step 2: Verify Model is Trained

The trained model should already be in `ml_model/risk_assessment_model.pkl`. If not:

```bash
# Generate synthetic data
python ml_model/generate_synthetic_data.py

# Train the model
python ml_model/train_model.py
```

### Step 3: Test the Model

```bash
# Run Python tests
python ml_model/test_model.py

# Run Playwright tests
npx playwright test ml-model-verification.spec.js
```

### Step 4: Start the Server

```bash
# Install Node dependencies (if needed)
npm install

# Start server
npm start
```

### Step 5: Verify API Endpoints

```bash
# Check ML model status
curl http://localhost:5000/api/ml-risk/status

# Get model metadata
curl http://localhost:5000/api/ml-risk/metadata

# Predict risk for a property
curl -X POST http://localhost:5000/api/ml-risk/predict/{propertyId}
```

## API Endpoints

### 1. `GET /api/ml-risk/status`
Check if ML model is available and ready.

**Response:**
```json
{
  "available": true,
  "message": "ML model is loaded and ready"
}
```

### 2. `GET /api/ml-risk/metadata`
Get model metadata and performance metrics.

**Response:**
```json
{
  "success": true,
  "metadata": {
    "model_type": "RandomForestRegressor",
    "algorithm": "Random Forest",
    "feature_columns": [...],
    "metrics": {...},
    "version": "1.0.0"
  }
}
```

### 3. `POST /api/ml-risk/predict/:propertyId`
Predict risk for a specific property.

**Response:**
```json
{
  "success": true,
  "propertyId": "...",
  "prediction": {
    "risk_score": 45.67,
    "risk_level": "Medium",
    "confidence": 78.5
  },
  "riskAssessmentId": "..."
}
```

### 4. `POST /api/ml-risk/batch-predict`
Batch predict risk for multiple properties.

**Request:**
```json
{
  "propertyIds": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "predictions": [...]
}
```

## Model Performance

### Metrics (Test Set)
- **R² Score**: 0.67
- **RMSE**: 9.19 points
- **MAE**: 7.22 points
- **Cross-Validation R²**: 0.54 ± 0.15

### Top 5 Important Features
1. `has_legal_case` (18.4%)
2. `dispute_severity` (11.2%)
3. `location_risk` (10.0%)
4. `num_active_loans` (8.9%)
5. `has_clear_title` (8.1%)

## Risk Level Classification

| Score Range | Risk Level |
|-------------|-----------|
| 0-39        | Low       |
| 40-59       | Medium    |
| 60-79       | High      |
| 80-100      | Critical  |

## Testing

### Run Playwright Tests

```bash
# Run ML model verification tests
npx playwright test ml-model-verification.spec.js

# Run API integration tests
npx playwright test ml-risk-api.spec.js

# Run all tests
npx playwright test
```

### Expected Results

All 8 ML model verification tests should pass:
- ✅ All ML model files exist
- ✅ Model metadata is valid
- ✅ Python model tests pass
- ✅ Predictions are valid with scores in range
- ✅ Dataset is comprehensive
- ✅ Feature importance visualization exists
- ✅ Predictions analysis visualization exists
- ✅ Edge cases handled gracefully

## Monitoring & Maintenance

### Model Drift
Monitor prediction distribution over time. Retrain if:
- Mean prediction score shifts significantly
- Prediction confidence decreases
- Actual outcomes diverge from predictions

### Retraining Schedule
- **Recommended**: Retrain monthly with new data
- **Trigger-based**: Retrain when accuracy drops below threshold

### Logging
Add logging to track:
- Prediction requests per day
- Average prediction confidence
- Distribution of risk levels
- Model errors (if actual outcomes available)

## Troubleshooting

### Issue: "ML model not available"
**Solution**: Run `python ml_model/train_model.py` to train the model.

### Issue: "Prediction failed"
**Solution**: 
1. Check Python dependencies are installed
2. Verify model files exist in `ml_model/`
3. Check server logs for error details

### Issue: Low prediction confidence
**Solution**: 
1. Increase training data size
2. Add more relevant features
3. Consider hyperparameter tuning

## Production Checklist

- [x] Model trained and evaluated
- [x] Test cases pass (8/8 Playwright tests)
- [x] Feature importance documented
- [x] API endpoints created
- [x] Error handling implemented
- [ ] Logging configured (add to server.js)
- [ ] Performance monitoring setup
- [ ] Retraining schedule defined
- [ ] Model version control

## Future Improvements

1. **Data Quality**: Use real data instead of synthetic data
2. **Feature Engineering**: Add more predictive features
3. **Model Comparison**: Test XGBoost, LightGBM
4. **Deployment**: Deploy as separate Python microservice (FastAPI)
5. **Monitoring**: Add prediction tracking and alerts
6. **A/B Testing**: Compare ML vs rule-based risk engine
7. **Explainability**: Add SHAP values for prediction explanations

## Support

For issues or questions:
- Check `ml_model/README.md` for ML model details
- Review test files for usage examples
- Check server logs for error messages

## License

Part of the LandIntel project for DYPCET Webathon 2026.
