def load_kaggle_dataset(self, file_path='sleep_data.csv'):
    """Load real Kaggle dataset"""
    print(" Loading Kaggle Sleep Health Dataset...")
    df = pd.read_csv(file_path)
    
    # Map columns to our features
    feature_map = {
        'Sleep Duration': 'sleep_duration',
        'Daily Steps': 'exercise_duration', 
        'Stress Level': 'stress_level',
        'Heart Rate': 'screen_time',  # Proxy
        'BMI Category': 'caffeine_intake'
    }
    
    # Process and return
    processed_df = df.rename(columns=feature_map)[list(feature_map.values()) + ['Quality']]
    print(f" Loaded {len(processed_df)} real samples!")
    return processed_df