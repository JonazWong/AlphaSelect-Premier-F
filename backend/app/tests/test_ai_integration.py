"""
Simple integration test to demonstrate AI model usage
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def test_feature_engineering():
    """Test feature engineering modules"""
    print("Testing feature engineering...")
    
    # Create sample contract data
    data = {
        'created_at': [datetime.utcnow() - timedelta(hours=i) for i in range(100, 0, -1)],
        'last_price': [50000 + np.sin(i/10) * 1000 + np.random.randn() * 100 for i in range(100)],
        'volume_24h': [1000000 + np.random.randn() * 100000 for _ in range(100)],
        'funding_rate': [0.0001 + np.random.randn() * 0.00005 for _ in range(100)],
        'open_interest': [5000000 + np.random.randn() * 500000 for _ in range(100)],
        'high_24h': [50500 + np.random.randn() * 100 for _ in range(100)],
        'low_24h': [49500 + np.random.randn() * 100 for _ in range(100)]
    }
    
    df = pd.DataFrame(data)
    
    # Test contract features
    from app.ai.features.contract_features import ContractFeatures
    df_with_features = ContractFeatures.add_all_features(df)
    
    print(f"  ✓ Added contract features: {len(df_with_features.columns)} total columns")
    
    # Test funding rate features
    from app.ai.features.funding_rate_features import FundingRateFeatures
    df_with_features = FundingRateFeatures.add_all_features(df_with_features)
    
    print(f"  ✓ Added funding rate features: {len(df_with_features.columns)} total columns")
    
    # Test OI features
    from app.ai.features.oi_features import OpenInterestFeatures
    df_with_features = OpenInterestFeatures.add_all_features(df_with_features)
    
    print(f"  ✓ Added OI features: {len(df_with_features.columns)} total columns")
    
    return df


def test_data_preprocessing():
    """Test data preprocessing"""
    print("\nTesting data preprocessing...")
    
    # Create sample data
    data = {
        'created_at': [datetime.utcnow() - timedelta(hours=i) for i in range(200, 0, -1)],
        'last_price': [50000 + np.sin(i/10) * 1000 + np.random.randn() * 100 for i in range(200)],
        'fair_price': [50000 + np.sin(i/10) * 1000 for i in range(200)],
        'index_price': [50000 + np.sin(i/10) * 1000 for i in range(200)],
        'funding_rate': [0.0001 + np.random.randn() * 0.00005 for _ in range(200)],
        'open_interest': [5000000 + np.random.randn() * 500000 for _ in range(200)],
        'volume_24h': [1000000 + np.random.randn() * 100000 for _ in range(200)],
        'price_change_24h': [np.random.randn() * 0.05 for _ in range(200)],
        'high_24h': [50500 + np.random.randn() * 100 for _ in range(200)],
        'low_24h': [49500 + np.random.randn() * 100 for _ in range(200)],
        'basis': [np.random.randn() * 10 for _ in range(200)],
        'basis_rate': [np.random.randn() * 0.0001 for _ in range(200)]
    }
    
    df = pd.DataFrame(data)
    
    from app.ai.training.data_preprocessor import DataPreprocessor
    preprocessor = DataPreprocessor()
    
    prepared_data = preprocessor.prepare_for_training(df)
    
    print(f"  ✓ Data split into train/val/test")
    print(f"    - Train samples: {prepared_data['n_train']}")
    print(f"    - Val samples: {prepared_data['n_val']}")
    print(f"    - Test samples: {prepared_data['n_test']}")
    print(f"    - Features: {prepared_data['n_features']}")
    
    return prepared_data


def test_xgboost_training():
    """Test XGBoost model training"""
    print("\nTesting XGBoost model training...")
    
    try:
        from app.ai.models.xgboost_model import XGBoostModel
        
        # Create model
        model = XGBoostModel('BTC_USDT', config={
            'n_estimators': 50,
            'max_depth': 4
        })
        
        print("  ✓ XGBoost model created")
        
        # Create simple training data
        X_train = np.random.randn(100, 10)
        y_train = np.random.randn(100)
        X_val = np.random.randn(20, 10)
        y_val = np.random.randn(20)
        
        model.feature_names = [f'feature_{i}' for i in range(10)]
        
        # Train model
        metrics = model.train(X_train, y_train, X_val, y_val)
        
        print(f"  ✓ Model trained")
        print(f"    - MAE: {metrics['mae']:.4f}")
        print(f"    - RMSE: {metrics['rmse']:.4f}")
        
        # Test prediction
        predictions = model.predict(X_val)
        print(f"  ✓ Predictions made: {len(predictions)} values")
        
        # Test evaluation
        eval_metrics = model.evaluate(X_val, y_val)
        print(f"  ✓ Model evaluated")
        print(f"    - R² Score: {eval_metrics['r2_score']:.4f}")
        print(f"    - Directional Accuracy: {eval_metrics['directional_accuracy']:.4f}")
        
        return model
        
    except ImportError as e:
        print(f"  ⚠ XGBoost not installed: {e}")
        return None


def test_ensemble():
    """Test ensemble model"""
    print("\nTesting Ensemble model...")
    
    try:
        from app.ai.models.ensemble_model import EnsembleModel
        from app.ai.models.xgboost_model import XGBoostModel
        
        # Create multiple models
        model1 = XGBoostModel('BTC_USDT', config={'n_estimators': 30})
        model2 = XGBoostModel('BTC_USDT', config={'n_estimators': 50})
        
        # Train models
        X_train = np.random.randn(100, 10)
        y_train = np.random.randn(100)
        X_val = np.random.randn(20, 10)
        y_val = np.random.randn(20)
        
        model1.feature_names = [f'feature_{i}' for i in range(10)]
        model2.feature_names = [f'feature_{i}' for i in range(10)]
        
        model1.train(X_train, y_train, X_val, y_val)
        model2.train(X_train, y_train, X_val, y_val)
        
        # Create ensemble
        ensemble = EnsembleModel('BTC_USDT', models=[model1, model2])
        
        print("  ✓ Ensemble created with 2 models")
        
        # Calculate weights
        ensemble.calculate_weights(X_val, y_val)
        
        print(f"  ✓ Weights calculated: {ensemble.model_weights}")
        
        # Make prediction
        predictions = ensemble.predict(X_val)
        print(f"  ✓ Ensemble predictions made: {len(predictions)} values")
        
        return ensemble
        
    except ImportError as e:
        print(f"  ⚠ Required libraries not installed: {e}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("AI/ML Integration Test")
    print("=" * 60)
    
    # Run tests
    test_feature_engineering()
    test_data_preprocessing()
    test_xgboost_training()
    test_ensemble()
    
    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)
