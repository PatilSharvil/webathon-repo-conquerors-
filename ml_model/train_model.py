"""
ML Model Training Pipeline for Risk Assessment

Algorithm: Random Forest Regressor
- Handles non-linear relationships
- Robust to outliers
- Provides feature importance
- Works well with mixed data types
- Less prone to overfitting

Alternative algorithms considered:
- Linear Regression: Too simple for complex risk patterns
- XGBoost: Good but more complex to deploy
- Neural Networks: Overkill for this dataset size
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score, 
    explained_variance_score, max_error
)
from sklearn.pipeline import Pipeline
import joblib
import json
import os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

class RiskAssessmentModel:
    def __init__(self, data_path=None):
        self.data_path = data_path or 'ml_model/synthetic_risk_data.csv'
        self.model = None
        self.preprocessor = None
        self.feature_columns = None
        self.label_encoders = {}
        self.metrics = {}
        
    def load_and_preprocess_data(self):
        """Load dataset and preprocess features"""
        print(f"Loading data from {self.data_path}...")
        data = pd.read_csv(self.data_path)
        
        print(f"Dataset shape: {data.shape}")
        print(f"Columns: {list(data.columns)}")
        
        # Separate features and target
        target = 'risk_score'
        features = [col for col in data.columns if col not in ['risk_score', 'risk_level']]
        
        X = data[features]
        y = data[target]
        
        # Encode categorical features
        categorical_cols = X.select_dtypes(include=['object']).columns
        
        for col in categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col])
            self.label_encoders[col] = le
        
        self.feature_columns = features
        self.data = data
        
        print(f"\nFeatures ({len(features)}): {features}")
        print(f"Categorical features encoded: {list(categorical_cols)}")
        
        return X, y
    
    def split_data(self, X, y, test_size=0.2, random_state=42):
        """Split data into train, validation, and test sets"""
        # First split: train+val vs test
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        # Second split: train vs val
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=0.2, random_state=random_state
        )
        
        print(f"\nData split:")
        print(f"  Training set: {len(X_train)} samples")
        print(f"  Validation set: {len(X_val)} samples")
        print(f"  Test set: {len(X_test)} samples")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def train_model(self, X_train, y_train, X_val, y_val):
        """Train Random Forest model with hyperparameter tuning"""
        print("\n" + "="*60)
        print("TRAINING RANDOM FOREST REGRESSOR")
        print("="*60)
        
        # Define parameter grid for grid search
        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, 30, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        # Initialize base model
        rf = RandomForestRegressor(
            random_state=42,
            n_jobs=-1,
            bootstrap=True
        )
        
        # Grid search with cross-validation
        print("\nPerforming hyperparameter tuning...")
        grid_search = GridSearchCV(
            estimator=rf,
            param_grid=param_grid,
            cv=3,
            n_jobs=-1,
            scoring='r2',
            verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        # Get best model
        self.model = grid_search.best_estimator_
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Best CV R² score: {grid_search.best_score_:.4f}")
        
        # Evaluate on validation set
        y_val_pred = self.model.predict(X_val)
        val_metrics = self.calculate_metrics(y_val, y_val_pred, "Validation")
        
        return val_metrics
    
    def calculate_metrics(self, y_true, y_pred, dataset_name="Test"):
        """Calculate comprehensive evaluation metrics"""
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        evs = explained_variance_score(y_true, y_pred)
        
        metrics = {
            'dataset': dataset_name,
            'mse': float(mse),
            'rmse': float(rmse),
            'mae': float(mae),
            'r2_score': float(r2),
            'explained_variance': float(evs),
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"\n{dataset_name} Set Metrics:")
        print(f"  Mean Squared Error: {mse:.4f}")
        print(f"  Root Mean Squared Error: {rmse:.4f}")
        print(f"  Mean Absolute Error: {mae:.4f}")
        print(f"  R² Score: {r2:.4f}")
        print(f"  Explained Variance: {evs:.4f}")
        
        return metrics
    
    def evaluate_model(self, X_test, y_test):
        """Final evaluation on test set"""
        print("\n" + "="*60)
        print("FINAL MODEL EVALUATION")
        print("="*60)
        
        y_pred = self.model.predict(X_test)
        test_metrics = self.calculate_metrics(y_test, y_pred, "Test")
        
        # Cross-validation score on full dataset
        cv_scores = cross_val_score(self.model, X_test, y_test, cv=5, scoring='r2')
        print(f"\nCross-Validation R² Scores: {cv_scores}")
        print(f"Mean CV R²: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        test_metrics['cv_mean_r2'] = float(cv_scores.mean())
        test_metrics['cv_std_r2'] = float(cv_scores.std())
        
        return test_metrics, y_pred
    
    def analyze_feature_importance(self):
        """Analyze and visualize feature importance"""
        print("\n" + "="*60)
        print("FEATURE IMPORTANCE ANALYSIS")
        print("="*60)
        
        importances = self.model.feature_importances_
        feature_names = self.feature_columns
        
        # Create DataFrame
        feature_importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print("\nFeature Importance (Top 10):")
        for idx, row in feature_importance_df.head(10).iterrows():
            print(f"  {row['feature']:30s}: {row['importance']:.4f}")
        
        # Plot feature importance
        plt.figure(figsize=(12, 8))
        sns.barplot(data=feature_importance_df.head(15), x='importance', y='feature', palette='viridis')
        plt.title('Top 15 Feature Importances for Risk Assessment')
        plt.xlabel('Importance')
        plt.ylabel('Feature')
        plt.tight_layout()
        
        plot_path = 'ml_model/feature_importance.png'
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"\nFeature importance plot saved to: {plot_path}")
        
        return feature_importance_df
    
    def plot_predictions(self, y_test, y_pred):
        """Create visualization of predictions"""
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        # Actual vs Predicted
        axes[0].scatter(y_test, y_pred, alpha=0.5, edgecolors='k', linewidth=0.5)
        axes[0].plot([0, 100], [0, 100], 'r--', linewidth=2)
        axes[0].set_xlabel('Actual Risk Score')
        axes[0].set_ylabel('Predicted Risk Score')
        axes[0].set_title('Actual vs Predicted Risk Scores')
        axes[0].set_xlim(0, 100)
        axes[0].set_ylim(0, 100)
        axes[0].grid(True, alpha=0.3)
        
        # Residual plot
        residuals = y_test - y_pred
        axes[1].scatter(y_pred, residuals, alpha=0.5, edgecolors='k', linewidth=0.5)
        axes[1].axhline(y=0, color='r', linestyle='--', linewidth=2)
        axes[1].set_xlabel('Predicted Risk Score')
        axes[1].set_ylabel('Residuals')
        axes[1].set_title('Residual Plot')
        axes[1].grid(True, alpha=0.3)
        
        # Distribution of errors
        axes[2].hist(residuals, bins=30, edgecolor='black', alpha=0.7)
        axes[2].set_xlabel('Prediction Error')
        axes[2].set_ylabel('Frequency')
        axes[2].set_title('Distribution of Prediction Errors')
        axes[2].axvline(x=0, color='r', linestyle='--', linewidth=2)
        axes[2].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plot_path = 'ml_model/predictions_analysis.png'
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        print(f"Predictions analysis plot saved to: {plot_path}")
        
    def save_model(self, model_dir='ml_model'):
        """Save trained model and preprocessing artifacts"""
        os.makedirs(model_dir, exist_ok=True)
        
        # Save model
        model_path = os.path.join(model_dir, 'risk_assessment_model.pkl')
        joblib.dump(self.model, model_path)
        print(f"\nModel saved to: {model_path}")
        
        # Save metadata
        metadata = {
            'feature_columns': self.feature_columns,
            'label_encoders': {k: list(v.classes_) for k, v in self.label_encoders.items()},
            'metrics': self.metrics,
            'model_type': 'RandomForestRegressor',
            'trained_at': datetime.now().isoformat(),
            'algorithm': 'Random Forest',
            'version': '1.0.0'
        }
        
        metadata_path = os.path.join(model_dir, 'model_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"Metadata saved to: {metadata_path}")
        
        return model_path, metadata_path
    
    def run_pipeline(self):
        """Execute complete training pipeline"""
        print("="*60)
        print("RISK ASSESSMENT ML MODEL TRAINING PIPELINE")
        print("="*60)
        
        # Step 1: Load and preprocess data
        X, y = self.load_and_preprocess_data()
        
        # Step 2: Split data
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_data(X, y)
        
        # Step 3: Train model
        val_metrics = self.train_model(X_train, y_train, X_val, y_val)
        
        # Step 4: Evaluate model
        test_metrics, y_pred = self.evaluate_model(X_test, y_test)
        self.metrics = {'validation': val_metrics, 'test': test_metrics}
        
        # Step 5: Analyze feature importance
        feature_importance = self.analyze_feature_importance()
        
        # Step 6: Create visualizations
        self.plot_predictions(y_test, y_pred)
        
        # Step 7: Save model
        model_path, metadata_path = self.save_model()
        
        print("\n" + "="*60)
        print("TRAINING PIPELINE COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"\nModel files:")
        print(f"  - Model: {model_path}")
        print(f"  - Metadata: {metadata_path}")
        print(f"  - Feature importance: ml_model/feature_importance.png")
        print(f"  - Predictions analysis: ml_model/predictions_analysis.png")
        
        return self.model, self.metrics


if __name__ == '__main__':
    # Initialize and run pipeline
    model_trainer = RiskAssessmentModel()
    model, metrics = model_trainer.run_pipeline()
    
    print("\n\nModel training complete and ready for deployment!")
