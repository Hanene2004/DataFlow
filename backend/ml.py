import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score
from sklearn.preprocessing import LabelEncoder

def train_and_predict(data: dict):
    """
    Expects data payload with:
    - data: list of dicts (the dataset)
    - target: string (column name to predict)
    - features: list of strings (input columns)
    - type: 'regression' | 'classification' (optional, auto-detect otherwise)
    """
    try:
        raw_data = data.get('data')
        target = data.get('target')
        features = data.get('features')
        model_type = data.get('type', 'regression')
        
        if not raw_data or not target or not features:
            return {"error": "Missing data, target, or features"}

        df = pd.DataFrame(raw_data)
        
        # Data Preparation
        X = df[features].copy()
        y = df[target].copy()
        
        # Simple preprocessing
        # Handle missing values
        X.fillna(0, inplace=True)
        # For target, drop rows with missing values
        valid_indices = y.notna()
        X = X[valid_indices]
        y = y[valid_indices]

        # Encode categorical variables if any exist in features
        le_dict = {}
        for col in X.columns:
            if X[col].dtype == 'object':
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                le_dict[col] = le
        
        # Encode target if classification/categorical
        if y.dtype == 'object' or model_type == 'classification':
             le_target = LabelEncoder()
             y = le_target.fit_transform(y.astype(str))

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        metrics = {}
        coefficients = {}
        
        if model_type == 'classification' or (len(np.unique(y)) < 10 and not pd.api.types.is_float_dtype(y)):
            # Classification
            model = LogisticRegression(max_iter=1000)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            metrics = {
                "accuracy": accuracy_score(y_test, preds)
            }
            # Coefs might be complex for multiclass, simplified here
        else:
            # Regression
            model = LinearRegression()
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            metrics = {
                "mse": mean_squared_error(y_test, preds),
                "r2": r2_score(y_test, preds)
            }
            coefficients = dict(zip(features, model.coef_))
            
            # Generate Actual vs Predicted data for plotting (using the test set)
            actual_vs_predicted = []
            y_test_list = y_test.tolist()
            preds_list = preds.tolist()
            
            for i in range(min(50, len(y_test_list))): # Limit to 50 points for chart clarity if needed
                 actual_vs_predicted.append({
                     "index": i,
                     "actual": float(y_test_list[i]),
                     "predicted": float(preds_list[i])
                 })
                 
        return {
            "status": "success",
            "metrics": metrics,
            "coefficients": coefficients,
            "model_type": model_type,
            "actual_vs_predicted": actual_vs_predicted
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
