# Risk Assessment ML Model

## Overview

This ML model predicts risk scores (0-100) for land/property sellers based on:
- **Ownership History**: Number of owners, transfer frequency, inheritance patterns
- **Loan Information**: Active/closed loans, defaults, loan-to-value ratios
- **Dispute Records**: Active/resolved disputes, severity, legal cases
- **Property Characteristics**: Age, area, location risk, zone classification

## Algorithm: Random Forest Regressor

**Why Random Forest?**
- ✅ Handles non-linear relationships between features
- ✅ Robust to outliers and noise
- ✅ Provides feature importance for interpretability
- ✅ Works well with mixed data types (numerical + categorical)
- ✅ Less prone to overfitting than single decision trees
- ✅ Fast inference time for production use

**Alternatives Considered:**
- Linear Regression: Too simple for complex risk patterns
- XGBoost: Good performance but more complex to deploy
- Neural Networks: Overkill for this dataset size

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Synthetic Data

```bash
python generate_synthetic_data.py
```

This creates:
- `synthetic_risk_data.csv` - 2000 samples with 19 features
- `synthetic_risk_data.json` - JSON format for Node.js integration
- `dataset_info.json` - Dataset metadata

### 3. Train the Model

```bash
python train_model.py
```

This will:
- Load and preprocess data
- Split into train/validation/test sets (64/16/20)
- Perform hyperparameter tuning with Grid Search
- Train Random Forest with cross-validation
- Evaluate on test set
- Generate visualizations
- Save model and metadata

**Output Files:**
- `risk_assessment_model.pkl` - Trained model
- `model_metadata.json` - Feature columns, encoders, metrics
- `feature_importance.png` - Feature importance visualization
- `predictions_analysis.png` - Prediction quality analysis

### 4. Test the Model

```bash
python test_model.py
```

Tests with 3 sample cases:
- Low Risk Seller
- Medium Risk Seller
- High Risk Seller

## Features

### Input Features (19 total)

| Feature | Type | Description |
|---------|------|-------------|
| `num_owners` | int | Number of previous owners (1-10) |
| `recent_transfers` | int | Transfers in last 5 years (0-8) |
| `avg_transfer_interval` | float | Average years between transfers |
| `has_inheritance` | binary | Property inherited (0/1) |
| `num_active_loans` | int | Current active loans (0-5) |
| `num_closed_loans` | int | Completed loans (0-8) |
| `total_loan_amount` | float | Total loan amount (0-5M) |
| `num_defaults` | int | Number of loan defaults (0-3) |
| `loan_to_value` | float | Loan to value ratio (0-1.5) |
| `num_active_disputes` | int | Current disputes (0-6) |
| `num_resolved_disputes` | int | Resolved disputes (0-5) |
| `dispute_severity` | float | Dispute severity score (0-10) |
| `has_legal_case` | binary | Active legal case (0/1) |
| `dispute_age_days` | float | Days since oldest dispute |
| `property_age` | float | Property age in years |
| `property_area` | float | Area in sq ft |
| `location_risk` | float | Location risk factor (1-10) |
| `has_clear_title` | binary | Clear documentation (0/1) |
| `zone_risk` | int | Zone classification risk (1-5) |
| `property_type` | categorical | Agricultural/Residential/Commercial/Industrial |

### Output

- **risk_score**: 0-100 (continuous)
- **risk_level**: Low/Medium/High/Critical (categorical)
  - Low: 0-39
  - Medium: 40-59
  - High: 60-79
  - Critical: 80-100

## Integration with Node.js Backend

### Option 1: Python Subprocess (Simple)

```javascript
const { spawn } = require('child_process');

async function predictRisk(features) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['ml_model/predict_api.py', JSON.stringify(features)]);
    
    let result = '';
    python.stdout.on('data', (data) => result += data);
    python.on('close', (code) => resolve(JSON.parse(result)));
  });
}
```

### Option 2: Load Model via REST API

Create a Flask/FastAPI microservice:

```python
# ml_model/api.py
from flask import Flask, request, jsonify
from test_model import RiskAssessmentPredictor

app = Flask(__name__)
predictor = RiskAssessmentPredictor()
predictor.load_model()

@app.route('/predict', methods=['POST'])
def predict():
    features = request.json
    result = predictor.predict(features)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5001)
```

### Option 3: Use JSON Model Export

For simple models, export to ONNX or use sklearn2pmml for Java/Node.js compatibility.

## Model Performance

Expected metrics (with 2000 samples):
- **R² Score**: ~0.85-0.92
- **RMSE**: ~5-8 points
- **MAE**: ~4-6 points

## File Structure

```
ml_model/
├── generate_synthetic_data.py  # Data generation script
├── train_model.py              # Training pipeline
├── test_model.py               # Testing & prediction
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── synthetic_risk_data.csv     # Generated dataset
├── synthetic_risk_data.json    # JSON dataset
├── dataset_info.json           # Dataset metadata
├── risk_assessment_model.pkl   # Trained model
├── model_metadata.json         # Model metadata
├── feature_importance.png      # Feature importance plot
└── predictions_analysis.png    # Prediction analysis plot
```

## Next Steps

1. **Hyperparameter Tuning**: Increase dataset size to 10,000+ samples
2. **Feature Engineering**: Add interaction terms, polynomial features
3. **Model Comparison**: Test XGBoost, LightGBM for better performance
4. **Deployment**: Deploy as Flask/FastAPI microservice
5. **Monitoring**: Track prediction drift over time
6. **Retraining**: Set up automated retraining pipeline

## Testing with Playwright

Use Playwright to test the ML model integration:
1. Test API endpoints that use the model
2. Verify prediction responses
3. Check error handling
4. Validate risk level classifications

## Production Deployment Checklist

- [ ] Model trained and evaluated
- [ ] Test cases pass
- [ ] Feature importance documented
- [ ] API endpoint created
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Performance monitored
- [ ] Retraining schedule set
- [ ] Version control for models

## License

Part of the LandIntel project for DYPCET Webathon 2026.
