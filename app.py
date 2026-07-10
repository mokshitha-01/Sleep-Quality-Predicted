"""
Sleep Quality Predictor - FIXED VERSION
✅ All imports included
✅ No more StandardScaler error
"""

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler  # ✅ FIXED!
import joblib
import json
import os
import warnings
from datetime import datetime

warnings.filterwarnings('ignore')

app = Flask(__name__)
app.secret_key = 'sleep_predictor_2024_fixed'

# Global predictor
predictor = None
history_file = 'user_history.json'

class SleepQualityPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'sleep_duration', 'caffeine_intake', 'exercise_duration',
            'screen_time', 'stress_level', 'mood_score', 'interruptions'
        ]
    
    def preprocess_features(self, features):
        processed = features.copy()
        caffeine_map = {'None': 0, 'Low': 1, 'Moderate': 2, 'High': 3}
        mood_map = {'Happy': 3, 'Neutral': 2, 'Sad': 1, 'Anxious': 0}
        
        processed['caffeine_intake'] = caffeine_map[features['caffeine_intake']]
        processed['mood_score'] = mood_map[features['mood']]
        processed['interruptions'] = 1 if features['interruptions'] == 'Yes' else 0
        
        return np.array([[
            processed['sleep_duration'], processed['caffeine_intake'],
            processed['exercise_duration'], processed['screen_time'],
            processed['stress_level'], processed['mood_score'],
            processed['interruptions']
        ]])
    
    def predict(self, features):
        processed_features = self.preprocess_features(features)
        processed_features_scaled = self.scaler.transform(processed_features)
        prediction = self.model.predict(processed_features_scaled)[0]
        probabilities = self.model.predict_proba(processed_features_scaled)[0]
        
        quality_map = {0: 'Poor', 1: 'Average', 2: 'Good'}
        return {
            'quality': quality_map[prediction],
            'confidence': max(probabilities) * 100,
            'probabilities': {
                'Poor': f"{probabilities[0]*100:.1f}%",
                'Average': f"{probabilities[1]*100:.1f}%",
                'Good': f"{probabilities[2]*100:.1f}%"
            }
        }
    
    def load_model(self):
        try:
            self.model = joblib.load('sleep_model.pkl')
            self.scaler = joblib.load('scaler.pkl')
            print("✅ Production model loaded!")
            return True
        except:
            print("⚠️  Creating default model...")
            return self._create_default_model()
    
    def _create_default_model(self):
        np.random.seed(42)
        n_samples = 2000
        data = {
            'sleep_duration': np.clip(np.random.normal(7, 1.5, n_samples), 2, 12),
            'caffeine_intake': np.random.choice([0,1,2,3], n_samples),
            'exercise_duration': np.clip(np.random.normal(30, 20, n_samples), 0, 180),
            'screen_time': np.clip(np.random.normal(60, 30, n_samples), 0, 240),
            'stress_level': np.random.uniform(0, 10, n_samples),
            'mood_score': np.random.choice([0,1,2,3], n_samples),
            'interruptions': np.random.choice([0,1], n_samples, p=[0.7, 0.3])
        }
        
        df = pd.DataFrame(data)
        df['quality'] = 2
        df.loc[(df['sleep_duration'] < 6) | (df['screen_time'] > 120), 'quality'] = 0
        df.loc[(df['stress_level'] > 7) | (df['caffeine_intake'] > 2), 'quality'] = 1
        
        X = df[self.feature_names]
        y = df['quality']
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        joblib.dump(self.model, 'sleep_model.pkl')
        joblib.dump(self.scaler, 'scaler.pkl')
        print("✅ Default model created & saved!")
        return True

# Initialize
predictor = SleepQualityPredictor()
predictor.load_model()

def load_history():
    if os.path.exists(history_file):
        with open(history_file, 'r') as f:
            return json.load(f)
    return []

def save_history(history):
    recent = history[-100:]
    with open(history_file, 'w') as f:
        json.dump(recent, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = {
            'sleep_duration': float(data['sleep_duration']),
            'caffeine_intake': data['caffeine_intake'],
            'exercise_duration': float(data['exercise_duration']),
            'screen_time': float(data['screen_time']),
            'stress_level': float(data['stress_level']),
            'mood': data['mood'],
            'interruptions': data['interruptions']
        }
        
        result = predictor.predict(features)
        
        # Save history
        history = load_history()
        entry = {
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'features': features,
            'prediction': result
        }
        history.append(entry)
        save_history(history)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/history')
def get_history():
    return jsonify(load_history()[-20:])

if __name__ == '__main__':
    print("🚀 Sleep Quality Predictor Starting...")
    print("📱 http://127.0.0.1:5000")
    print("📊 http://127.0.0.1:5000/dashboard")
    app.run(debug=True, port=5000)