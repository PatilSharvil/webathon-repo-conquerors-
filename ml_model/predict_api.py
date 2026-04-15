"""
Prediction API Script - Called by Node.js service for risk predictions

Usage: python predict_api.py '{"feature1": value1, "feature2": value2, ...}'

Outputs JSON prediction result to stdout
"""

import sys
import json
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# Import predictor class
sys.path.append('ml_model')
from test_model import RiskAssessmentPredictor

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No features provided'}))
        sys.exit(1)
    
    try:
        # Parse features from command line argument
        features = json.loads(sys.argv[1])
        
        # Initialize predictor
        predictor = RiskAssessmentPredictor(
            model_path='ml_model/risk_assessment_model.pkl',
            metadata_path='ml_model/model_metadata.json'
        )
        
        # Load model (suppress output)
        import io
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        predictor.load_model()
        sys.stdout = old_stdout
        
        # Make prediction
        result = predictor.predict(features)
        
        # Add feature importance
        result['feature_importance'] = predictor.get_feature_importance()
        
        # Output result as JSON (only JSON to stdout)
        print(json.dumps(result, indent=2))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'risk_score': 50.0,
            'risk_level': 'Medium'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()
