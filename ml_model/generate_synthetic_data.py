"""
Synthetic Data Generator for Seller Risk Assessment ML Model

Generates realistic seller/property data with risk scores based on:
- Ownership history (number of transfers, frequency)
- Loan information (count, amounts, status)
- Dispute records (count, type, status)
- Property characteristics
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os

class SyntheticDataGenerator:
    def __init__(self, n_samples=1000, random_seed=42):
        self.n_samples = n_samples
        np.random.seed(random_seed)
        
    def generate_ownership_features(self):
        """Generate ownership-related features"""
        # Number of previous owners (0-10)
        num_owners = np.random.poisson(3, self.n_samples)
        num_owners = np.clip(num_owners, 1, 10)
        
        # Number of ownership transfers in last 5 years (0-8)
        recent_transfers = np.random.poisson(1.5, self.n_samples)
        recent_transfers = np.clip(recent_transfers, 0, 8)
        
        # Average years between transfers (1-30)
        avg_transfer_interval = np.random.exponential(5, self.n_samples)
        avg_transfer_interval = np.clip(avg_transfer_interval, 1, 30)
        
        # Has inherited property (binary)
        has_inheritance = np.random.binomial(1, 0.3, self.n_samples)
        
        return num_owners, recent_transfers, avg_transfer_interval, has_inheritance
    
    def generate_loan_features(self):
        """Generate loan-related features"""
        # Number of active loans (0-5)
        num_active_loans = np.random.poisson(1, self.n_samples)
        num_active_loans = np.clip(num_active_loans, 0, 5)
        
        # Number of closed loans (0-8)
        num_closed_loans = np.random.poisson(2, self.n_samples)
        num_closed_loans = np.clip(num_closed_loans, 0, 8)
        
        # Total active loan amount (0-5,000,000)
        total_loan_amount = np.random.exponential(500000, self.n_samples)
        total_loan_amount = np.clip(total_loan_amount, 0, 5000000)
        
        # Number of loan defaults (0-3)
        num_defaults = np.random.binomial(1, 0.15, self.n_samples)
        num_defaults = np.where(num_defaults == 1, 
                                np.random.poisson(1, self.n_samples), 
                                0)
        num_defaults = np.clip(num_defaults, 0, 3)
        
        # Loan to value ratio (0-1.5)
        loan_to_value = np.random.beta(2, 5, self.n_samples) * 1.5
        
        return num_active_loans, num_closed_loans, total_loan_amount, num_defaults, loan_to_value
    
    def generate_dispute_features(self):
        """Generate dispute-related features"""
        # Number of active disputes (0-6)
        num_active_disputes = np.random.poisson(0.8, self.n_samples)
        num_active_disputes = np.clip(num_active_disputes, 0, 6)
        
        # Number of resolved disputes (0-5)
        num_resolved_disputes = np.random.poisson(1.2, self.n_samples)
        num_resolved_disputes = np.clip(num_resolved_disputes, 0, 5)
        
        # Dispute severity score (0-10)
        dispute_severity = np.random.exponential(2, self.n_samples)
        dispute_severity = np.clip(dispute_severity, 0, 10)
        
        # Has legal case (binary)
        has_legal_case = np.random.binomial(1, 0.2, self.n_samples)
        
        # Dispute age in days (for oldest dispute)
        dispute_age_days = np.random.exponential(365, self.n_samples)
        dispute_age_days = np.clip(dispute_age_days, 30, 3650)
        
        return num_active_disputes, num_resolved_disputes, dispute_severity, has_legal_case, dispute_age_days
    
    def generate_property_features(self):
        """Generate property-related features"""
        # Property age in years (1-100)
        property_age = np.random.normal(30, 15, self.n_samples)
        property_age = np.clip(property_age, 1, 100)
        
        # Property area in sq ft (500-50000)
        property_area = np.random.lognormal(8, 1.5, self.n_samples)
        property_area = np.clip(property_area, 500, 50000)
        
        # Location risk factor (1-10, higher = riskier location)
        location_risk = np.random.uniform(1, 10, self.n_samples)
        
        # Property type (categorical: Agricultural, Residential, Commercial, Industrial)
        property_types = ['Agricultural', 'Residential', 'Commercial', 'Industrial']
        property_type_probs = [0.3, 0.4, 0.2, 0.1]
        property_type = np.random.choice(property_types, self.n_samples, p=property_type_probs)
        
        # Has clear title documentation (binary)
        has_clear_title = np.random.binomial(1, 0.75, self.n_samples)
        
        # Zone classification risk (1-5)
        zone_risk = np.random.randint(1, 6, self.n_samples)
        
        return property_age, property_area, location_risk, property_type, has_clear_title, zone_risk
    
    def calculate_risk_score(self, features_df):
        """
        Calculate risk score based on weighted combination of features
        Score ranges from 0 (no risk) to 100 (critical risk)
        Adjusted for better distribution across risk levels
        """
        score = np.zeros(self.n_samples)
        
        # Ownership factors (weight: 25%)
        score += (features_df['num_owners'] / 10) * 20
        score += (features_df['recent_transfers'] / 8) * 25
        score += ((30 - features_df['avg_transfer_interval']) / 30) * 10
        score += features_df['has_inheritance'] * 5
        
        # Loan factors (weight: 30%)
        score += (features_df['num_active_loans'] / 5) * 20
        score += (features_df['total_loan_amount'] / 5000000) * 15
        score += (features_df['num_defaults'] / 3) * 25
        score += (features_df['loan_to_value'] / 1.5) * 15
        
        # Dispute factors (weight: 35%)
        score += (features_df['num_active_disputes'] / 6) * 25
        score += (features_df['dispute_severity'] / 10) * 25
        score += features_df['has_legal_case'] * 15
        score += ((3650 - features_df['dispute_age_days']) / 3650) * 5
        
        # Property factors (weight: 10%)
        score += (features_df['property_age'] / 100) * 8
        score += (features_df['location_risk'] / 10) * 12
        score += (1 - features_df['has_clear_title']) * 10
        score += (features_df['zone_risk'] / 5) * 8
        
        # Scale to 0-100 range with better distribution
        # Apply sigmoid-like transformation for normal distribution
        score = 100 / (1 + np.exp(-(score - 60) / 20))
        
        # Add some noise for realism
        noise = np.random.normal(0, 6, self.n_samples)
        score = np.clip(score + noise, 0, 100)
        
        return np.round(score, 2)
    
    def generate_dataset(self):
        """Generate complete synthetic dataset"""
        print(f"Generating synthetic dataset with {self.n_samples} samples...")
        
        # Generate features
        num_owners, recent_transfers, avg_transfer_interval, has_inheritance = self.generate_ownership_features()
        num_active_loans, num_closed_loans, total_loan_amount, num_defaults, loan_to_value = self.generate_loan_features()
        num_active_disputes, num_resolved_disputes, dispute_severity, has_legal_case, dispute_age_days = self.generate_dispute_features()
        property_age, property_area, location_risk, property_type, has_clear_title, zone_risk = self.generate_property_features()
        
        # Create DataFrame
        data = pd.DataFrame({
            'num_owners': num_owners,
            'recent_transfers': recent_transfers,
            'avg_transfer_interval': avg_transfer_interval,
            'has_inheritance': has_inheritance,
            'num_active_loans': num_active_loans,
            'num_closed_loans': num_closed_loans,
            'total_loan_amount': total_loan_amount,
            'num_defaults': num_defaults,
            'loan_to_value': loan_to_value,
            'num_active_disputes': num_active_disputes,
            'num_resolved_disputes': num_resolved_disputes,
            'dispute_severity': dispute_severity,
            'has_legal_case': has_legal_case,
            'dispute_age_days': dispute_age_days,
            'property_age': property_age,
            'property_area': property_area,
            'location_risk': location_risk,
            'has_clear_title': has_clear_title,
            'zone_risk': zone_risk,
            'property_type': property_type
        })
        
        # Calculate risk score
        data['risk_score'] = self.calculate_risk_score(data)
        
        # Add risk level categories
        conditions = [
            data['risk_score'] >= 80,
            (data['risk_score'] >= 60) & (data['risk_score'] < 80),
            (data['risk_score'] >= 40) & (data['risk_score'] < 60),
            data['risk_score'] < 40
        ]
        choices = ['Critical', 'High', 'Medium', 'Low']
        data['risk_level'] = np.select(conditions, choices, default='Low')
        
        print(f"Dataset generated successfully!")
        print(f"Risk score distribution:")
        print(f"  Mean: {data['risk_score'].mean():.2f}")
        print(f"  Std: {data['risk_score'].std():.2f}")
        print(f"  Min: {data['risk_score'].min():.2f}")
        print(f"  Max: {data['risk_score'].max():.2f}")
        print(f"\nRisk level distribution:")
        print(data['risk_level'].value_counts())
        
        return data
    
    def save_dataset(self, data, output_dir='ml_model'):
        """Save dataset to CSV and JSON formats"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Save as CSV
        csv_path = os.path.join(output_dir, 'synthetic_risk_data.csv')
        data.to_csv(csv_path, index=False)
        print(f"\nDataset saved to: {csv_path}")
        
        # Save as JSON (for JavaScript/Node.js compatibility)
        json_path = os.path.join(output_dir, 'synthetic_risk_data.json')
        data.to_json(json_path, orient='records', indent=2)
        print(f"Dataset saved to: {json_path}")
        
        # Save dataset info
        info = {
            'n_samples': len(data),
            'n_features': data.shape[1] - 2,  # Exclude risk_score and risk_level
            'features': list(data.columns[:-2]),
            'target': 'risk_score',
            'generated_at': datetime.now().isoformat(),
            'risk_level_distribution': data['risk_level'].value_counts().to_dict()
        }
        
        info_path = os.path.join(output_dir, 'dataset_info.json')
        with open(info_path, 'w') as f:
            json.dump(info, f, indent=2)
        print(f"Dataset info saved to: {info_path}")
        
        return csv_path, json_path


if __name__ == '__main__':
    # Generate dataset
    generator = SyntheticDataGenerator(n_samples=2000, random_seed=42)
    data = generator.generate_dataset()
    
    # Save dataset
    csv_path, json_path = generator.save_dataset(data)
    
    # Display sample
    print("\nSample data (first 5 rows):")
    print(data.head())
    
    print("\nDataset generation complete!")
