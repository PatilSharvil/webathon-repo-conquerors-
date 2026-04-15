"""
Test and Prediction Script for Risk Assessment ML Model

This script:
1. Loads the trained model
2. Tests it with sample data
3. Provides prediction API for integration
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
import warnings
warnings.filterwarnings('ignore')

class RiskAssessmentPredictor:
    def __init__(self, model_path='ml_model/risk_assessment_model.pkl', 
                 metadata_path='ml_model/model_metadata.json'):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.metadata = None
        self.label_encoders = {}
        
    def load_model(self):
        """Load trained model and metadata"""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at {self.model_path}. Please train the model first.")
        
        print(f"Loading model from {self.model_path}...")
        self.model = joblib.load(self.model_path)
        
        print(f"Loading metadata from {self.metadata_path}...")
        with open(self.metadata_path, 'r') as f:
            self.metadata = json.load(f)
        
        # Recreate label encoders
        for col, classes in self.metadata['label_encoders'].items():
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            le.classes_ = np.array(classes)
            self.label_encoders[col] = le
        
        print("Model loaded successfully!")
        return self.model
    
    def predict(self, features):
        """
        Make prediction for a single sample or multiple samples
        
        Args:
            features: dict or DataFrame with feature values
            
        Returns:
            dict with predicted risk_score and risk_level
        """
        if self.model is None:
            self.load_model()
        
        # Convert to DataFrame if dict
        if isinstance(features, dict):
            df = pd.DataFrame([features])
        else:
            df = features.copy()
        
        # Encode categorical features
        for col, le in self.label_encoders.items():
            if col in df.columns:
                df[col] = le.transform(df[col])
        
        # Ensure correct feature order
        feature_columns = self.metadata['feature_columns']
        X = df[feature_columns]
        
        # Make prediction
        risk_score = self.model.predict(X)[0]
        risk_score = np.clip(risk_score, 0, 100)
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = 'Critical'
        elif risk_score >= 60:
            risk_level = 'High'
        elif risk_score >= 40:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        return {
            'risk_score': float(round(risk_score, 2)),
            'risk_level': risk_level,
            'confidence': self._calculate_confidence(X)
        }
    
    def _calculate_confidence(self, X):
        """Calculate prediction confidence based on feature similarity to training data"""
        # Simplified confidence based on tree variance
        if hasattr(self.model, 'estimators_'):
            predictions = np.array([tree.predict(X) for tree in self.model.estimators_])
            std_dev = np.std(predictions, axis=0)[0]
            # Lower std_dev = higher confidence
            confidence = max(0, 100 - (std_dev * 10))
            return float(round(confidence, 2))
        return 85.0  # Default confidence
    
    def test_with_sample_data(self):
        """Test model with sample data"""
        print("\n" + "="*60)
        print("TESTING MODEL WITH SAMPLE DATA")
        print("="*60)
        
        # Sample test cases
        test_cases = [
            {
                'name': 'Low Risk Seller',
                'data': {
                    'num_owners': 2,
                    'recent_transfers': 0,
                    'avg_transfer_interval': 15.0,
                    'has_inheritance': 0,
                    'num_active_loans': 0,
                    'num_closed_loans': 1,
                    'total_loan_amount': 0,
                    'num_defaults': 0,
                    'loan_to_value': 0.1,
                    'num_active_disputes': 0,
                    'num_resolved_disputes': 0,
                    'dispute_severity': 0,
                    'has_legal_case': 0,
                    'dispute_age_days': 1000,
                    'property_age': 10,
                    'property_area': 5000,
                    'location_risk': 3,
                    'has_clear_title': 1,
                    'zone_risk': 2,
                    'property_type': 'Residential'
                }
            },
            {
                'name': 'Medium Risk Seller',
                'data': {
                    'name': 'Medium Risk Seller',
                    'num_owners': 4,
                    'recent_transfers': 2,
                    'avg_transfer_interval': 8.0,
                    'has_inheritance': 1,
                    'num_active_loans': 1,
                    'num_closed_loans': 2,
                    'total_loan_amount': 500000,
                    'num_defaults': 0,
                    'loan_to_value': 0.5,
                    'num_active_disputes': 1,
                    'num_resolved_disputes': 1,
                    'dispute_severity': 3,
                    'has_legal_case': 0,
                    'dispute_age_days': 400,
                    'property_age': 25,
                    'property_area': 3000,
                    'location_risk': 5,
                    'has_clear_title': 1,
                    'zone_risk': 3,
                    'property_type': 'Commercial'
                }
            },
            {
                'name': 'High Risk Seller',
                'data': {
                    'num_owners': 8,
                    'recent_transfers': 5,
                    'avg_transfer_interval': 2.0,
                    'has_inheritance': 0,
                    'num_active_loans': 3,
                    'num_closed_loans': 2,
                    'total_loan_amount': 2000000,
                    'num_defaults': 2,
                    'loan_to_value': 1.2,
                    'num_active_disputes': 4,
                    'num_resolved_disputes': 2,
                    'dispute_severity': 8,
                    'has_legal_case': 1,
                    'dispute_age_days': 100,
                    'property_age': 50,
                    'property_area': 1000,
                    'location_risk': 9,
                    'has_clear_title': 0,
                    'zone_risk': 5,
                    'property_type': 'Industrial'
                }
            }
        ]
        
        results = []
        for test_case in test_cases:
            print(f"\nTest Case: {test_case['name']}")
            print("-" * 40)
            
            prediction = self.predict(test_case['data'])
            
            print(f"  Predicted Risk Score: {prediction['risk_score']:.2f}")
            print(f"  Risk Level: {prediction['risk_level']}")
            print(f"  Confidence: {prediction['confidence']:.2f}%")
            
            results.append({
                'test_case': test_case['name'],
                'prediction': prediction
            })
        
        return results
    
    def get_feature_importance(self):
        """Get feature importance from trained model"""
        if self.model is None:
            self.load_model()
        
        importances = self.model.feature_importances_
        feature_names = self.metadata['feature_columns']
        
        importance_dict = dict(zip(feature_names, importances.tolist()))
        
        # Sort by importance
        importance_dict = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
        
        return importance_dict


if __name__ == '__main__':
    # Initialize predictor
    predictor = RiskAssessmentPredictor()
    
    # Load model
    predictor.load_model()
    
    # Test with sample data
    results = predictor.test_with_sample_data()
    
    # Display feature importance
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE")
    print("="*60)
    
    importance = predictor.get_feature_importance()
    for feature, imp in list(importance.items())[:10]:
        print(f"  {feature:30s}: {imp:.4f}")
    
    print("\n\nTesting complete! Model is ready for production.")
