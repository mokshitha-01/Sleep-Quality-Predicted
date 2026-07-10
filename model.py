import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import warnings
warnings.filterwarnings('ignore')

class SleepQualityPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = [
            'sleep_duration', 'caffeine_intake', 'exercise_duration',
            'screen_time', 'stress_level', 'mood_score', 'interruptions'
        ]
    
    def preprocess_features(self, features):
        """Convert categorical features to numerical"""
        processed = features.copy()
        
        # Caffeine mapping
        caffeine_map = {'None': 0, 'Low': 1, 'Moderate': 2, 'High': 3}
        processed['caffeine_intake'] = caffeine_map[features['caffeine_intake']]
        
        # Mood mapping
        mood_map = {'Happy': 3, 'Neutral': 2, 'Sad': 1, 'Anxious': 0}
        processed['mood_score'] = mood_map[features['mood']]
        
        # Interruptions
        processed['interruptions'] = 1 if features['interruptions'] == 'Yes' else 0
        
        return np.array([[
            processed['sleep_duration'],
            processed['caffeine_intake'],
            processed['exercise_duration'],
            processed['screen_time'],
            processed['stress_level'],
            processed['mood_score'],
            processed['interruptions']
        ]])
    
    def predict(self, features):
        """Predict sleep quality"""
        processed_features = self.preprocess_features(features)
        processed_features = self.scaler.transform(processed_features)
        prediction = self.model.predict(processed_features)[0]
        probability = self.model.predict_proba(processed_features)[0]
        
        quality_map = {0: 'Poor', 1: 'Average', 2: 'Good'}
        return {
            'quality': quality_map[prediction],
            'confidence': max(probability) * 100,
            'probabilities': {
                'Poor': f"{probability[0]*100:.1f}%",
                'Average': f"{probability[1]*100:.1f}%",
                'Good': f"{probability[2]*100:.1f}%"
            }
        }
    
    def load_model(self):
        """Load pre-trained model"""
        try:
            self.model = joblib.load('sleep_model.pkl')
            self.scaler = joblib.load('scaler.pkl')
            return True
        except:
            return self.train_default_model()
    
    def train_default_model(self):
        """Train model with synthetic data"""
        np.random.seed(42)
        n_samples = 1000
        
        data = {
            'sleep_duration': np.random.normal(7, 1.5, n_samples).clip(2, 12),
            'caffeine_intake': np.random.choice([0,1,2,3], n_samples),
            'exercise_duration': np.random.normal(30, 20, n_samples).clip(0, 180),
            'screen_time': np.random.normal(60, 30, n_samples).clip(0, 240),
            'stress_level': np.random.uniform(0, 10, n_samples),
            'mood_score': np.random.choice([0,1,2,3], n_samples),
            'interruptions': np.random.choice([0,1], n_samples, p=[0.7, 0.3])
        }
        
        df = pd.DataFrame(data)
        
        # Create target variable based on logical rules
        df['quality'] = 2  # Good
        df.loc[(df['sleep_duration'] < 6) | (df['screen_time'] > 120), 'quality'] = 0  # Poor
        df.loc[(df['stress_level'] > 7) | (df['caffeine_intake'] > 2), 'quality'] = 1  # Average
        
        X = df[self.feature_names]
        y = df['quality']
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        joblib.dump(self.model, 'sleep_model.pkl')
        joblib.dump(self.scaler, 'scaler.pkl')
        return True