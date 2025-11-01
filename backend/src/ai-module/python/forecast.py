import numpy as np
import pandas as pd
import joblib
import os
import json
import warnings
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.arima.model import ARIMA
warnings.filterwarnings('ignore')

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

API_KEY = "YOUR_API_KEY_HERE"

def create_features(df):
    df = df.copy()
    df['date'] = pd.to_datetime(df['date'])
    df['dayofweek'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['year'] = df['date'].dt.year
    df['day'] = df['date'].dt.day
    df['quarter'] = df['date'].dt.quarter
    return df

def train_model(product_id, sales_data):
    df = pd.DataFrame(sales_data)
    df = create_features(df)
    
    X = df[['dayofweek', 'month', 'year', 'day', 'quarter']]
    y = df['quantity']
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)
    
    model_path = os.path.join(MODEL_DIR, f'model_{product_id}.joblib')
    scaler_path = os.path.join(MODEL_DIR, f'scaler_{product_id}.joblib')
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    return {"status": "success", "message": f"Model for product {product_id} trained successfully"}

def predict_sales(product_id, days=30):
    model_path = os.path.join(MODEL_DIR, f'model_{product_id}.joblib')
    scaler_path = os.path.join(MODEL_DIR, f'scaler_{product_id}.joblib')
    
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        return {"status": "error", "message": f"No model found for product {product_id}"}
    
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    
    start_date = datetime.now()
    dates = [start_date + timedelta(days=i) for i in range(days)]
    
    future_df = pd.DataFrame({
        'date': dates,
        'dayofweek': [d.dayofweek for d in dates],
        'month': [d.month for d in dates],
        'year': [d.year for d in dates],
        'day': [d.day for d in dates],
        'quarter': [d.quarter for d in dates]
    })
    
    X_future = future_df[['dayofweek', 'month', 'year', 'day', 'quarter']]
    X_future_scaled = scaler.transform(X_future)
    
    predictions = model.predict(X_future_scaled)
    
    daily_data = []
    for i, date in enumerate(dates):
        daily_data.append({
            "date": date.strftime("%Y-%m-%d"),
            "demand": max(0, int(round(predictions[i])))
        })
    
    total_demand = sum(max(0, int(round(p))) for p in predictions)
    avg_daily = total_demand / len(predictions)
    
    variance = np.var(predictions)
    std_dev = np.sqrt(variance)
    z_score = 1.96  # 95% confidence
    
    lower_bound = max(0, int(round(total_demand - z_score * std_dev)))
    upper_bound = int(round(total_demand + z_score * std_dev))
    
    result = {
        "product_id": product_id,
        "period": days,
        "start_date": dates[0].strftime("%Y-%m-%d"),
        "end_date": dates[-1].strftime("%Y-%m-%d"),
        "total_demand": total_demand,
        "average_daily_demand": round(avg_daily, 2),
        "confidence_level": 95,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound,
        "daily_forecast": daily_data,
        "model": "random_forest"
    }
    
    return result

def arima_forecast(product_id, sales_data, days=30):
    df = pd.DataFrame(sales_data)
    df = df.sort_values('date')
    
    try:
        model = ARIMA(df['quantity'].values, order=(5,1,0))
        model_fit = model.fit()
        
        forecast = model_fit.forecast(steps=days)
        forecast = np.maximum(forecast, 0)  # No negative sales
        
        start_date = datetime.now()
        dates = [start_date + timedelta(days=i) for i in range(days)]
        
        daily_data = []
        for i, date in enumerate(dates):
            daily_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "demand": int(round(forecast[i]))
            })
        
        total_demand = sum(int(round(p)) for p in forecast)
        avg_daily = total_demand / len(forecast)
        
        result = {
            "product_id": product_id,
            "period": days,
            "start_date": dates[0].strftime("%Y-%m-%d"),
            "end_date": dates[-1].strftime("%Y-%m-%d"),
            "total_demand": total_demand,
            "average_daily_demand": round(avg_daily, 2),
            "confidence_level": 95,
            "lower_bound": int(round(total_demand * 0.8)),
            "upper_bound": int(round(total_demand * 1.2)),
            "daily_forecast": daily_data,
            "model": "arima"
        }
        
        return result
    except:
        return {"status": "error", "message": "Failed to create ARIMA forecast"}

def ensemble_forecast(product_id, sales_data, days=30):
    rf_forecast = predict_sales(product_id, days)
    arima_result = arima_forecast(product_id, sales_data, days)
    
    if isinstance(rf_forecast, dict) and "status" in rf_forecast and rf_forecast["status"] == "error":
        return arima_result
    
    if isinstance(arima_result, dict) and "status" in arima_result and arima_result["status"] == "error":
        return rf_forecast
    
    rf_daily = rf_forecast["daily_forecast"]
    arima_daily = arima_result["daily_forecast"]
    
    ensemble_daily = []
    for i in range(len(rf_daily)):
        rf_demand = rf_daily[i]["demand"]
        arima_demand = arima_daily[i]["demand"]
        
        ensemble_daily.append({
            "date": rf_daily[i]["date"],
            "demand": int(round((rf_demand + arima_demand) / 2))
        })
    
    total_demand = sum(day["demand"] for day in ensemble_daily)
    avg_daily = total_demand / len(ensemble_daily)
    
    result = {
        "product_id": product_id,
        "period": days,
        "start_date": rf_daily[0]["date"],
        "end_date": rf_daily[-1]["date"],
        "total_demand": total_demand,
        "average_daily_demand": round(avg_daily, 2),
        "confidence_level": 95,
        "lower_bound": int(round(total_demand * 0.85)),
        "upper_bound": int(round(total_demand * 1.15)),
        "daily_forecast": ensemble_daily,
        "model": "ensemble"
    }
    
    return result

def detect_anomalies(transaction_data, threshold=3):
    df = pd.DataFrame(transaction_data)
    
    if len(df) < 10:
        return {"status": "error", "message": "Insufficient data for anomaly detection"}
    
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    df['rolling_mean'] = df['quantity'].rolling(window=7, min_periods=1).mean()
    df['rolling_std'] = df['quantity'].rolling(window=7, min_periods=1).std()
    
    df['z_score'] = (df['quantity'] - df['rolling_mean']) / df['rolling_std'].replace(0, 1)
    
    anomalies = df[abs(df['z_score']) > threshold].copy()
    
    if len(anomalies) == 0:
        return {"status": "success", "anomalies": [], "message": "No anomalies detected"}
    
    result = []
    for _, row in anomalies.iterrows():
        result.append({
            "date": row['date'].strftime("%Y-%m-%d"),
            "quantity": int(row['quantity']),
            "expected": round(float(row['rolling_mean']), 2),
            "z_score": round(float(row['z_score']), 2)
        })
    
    return {
        "status": "success", 
        "anomalies": result,
        "message": f"Detected {len(result)} anomalies"
    }

def optimize_inventory(product_data, forecast_data):
    products = pd.DataFrame(product_data)
    forecasts = pd.DataFrame(forecast_data)
    
    if len(products) == 0 or len(forecasts) == 0:
        return {"status": "error", "message": "No product or forecast data provided"}
    
    results = []
    
    for _, product in products.iterrows():
        p_id = product['id']
        forecast = forecasts[forecasts['product_id'] == p_id]
        
        if len(forecast) == 0:
            continue
            
        current_stock = product['quantity']
        min_stock = product['minStockLevel']
        daily_demand = forecast['average_daily_demand'].values[0]
        
        days_until_reorder = 0
        if daily_demand > 0:
            days_until_reorder = max(0, (current_stock - min_stock) / daily_demand)
        
        suggested_reorder = max(0, min_stock * 2 - current_stock)
        
        reorder_status = "OK"
        if days_until_reorder <= 7:
            reorder_status = "REORDER_SOON"
        if current_stock <= min_stock:
            reorder_status = "REORDER_NOW"
        
        results.append({
            "product_id": p_id,
            "name": product['name'],
            "current_stock": current_stock,
            "min_stock_level": min_stock,
            "forecast_daily_demand": daily_demand,
            "days_until_reorder_point": round(days_until_reorder, 1),
            "suggested_reorder_amount": int(suggested_reorder),
            "status": reorder_status
        })
    
    return {
        "status": "success",
        "recommendations": results,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

if __name__ == "__main__":
    pass 