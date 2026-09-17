import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest
from google import genai


# 0. Load Environment Variables (Security Fix)

# This reads the hidden .env file so we don't hardcode the API key
load_dotenv()

app = FastAPI(title="Ultron AI Core", version="4.0")


# 1. Initialize New Google GenAI Client

# Pulls the API key dynamically from the hidden .env file
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class KPIPayload(BaseModel):
    name: str
    target_value: float
    actual_value: float

@app.get("/")
def read_root():
    return {"status": "Online", "system": "Ultron ML & Gemini Pipeline Active"}

@app.post("/api/predict")
def predict_performance(kpi: KPIPayload):
    
    # 2. MACHINE LEARNING: Statistical Anomaly Detection
    # Generate 30 days of synthetic historical baseline data
    np.random.seed(42)
    historical_values = np.random.normal(loc=kpi.target_value, scale=kpi.target_value * 0.05, size=30)
    current_value = np.array([kpi.actual_value])
    all_values = np.concatenate([historical_values, current_value]).reshape(-1, 1)
    
    # Train the Scikit-Learn model on the fly
    ml_model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    ml_model.fit(all_values)
    
    # Predict if the current value is a statistical outlier
    prediction = ml_model.predict(current_value.reshape(-1, 1))[0]
    variance = (kpi.actual_value / kpi.target_value) * 100
    is_anomaly = bool(prediction == -1)

    # 3. GENERATIVE AI: Strategic Contextual Analysis
    try:
        prompt = f"""
        You are 'Ultron', an elite AI strategic advisor for The University of Zambia (UNZA). 
        Analyze the following Balanced Scorecard KPI:
        - Metric: {kpi.name}
        - Target: {kpi.target_value}
        - Actual: {kpi.actual_value}
        - Performance Variance: {variance:.2f}%
        - Statistical Anomaly Detected: {'Yes' if is_anomaly else 'No'}

        Provide a brief, executive-level strategic insight (maximum 3 sentences). 
        Include a recommended action based on the variance.
        Keep the tone professional, analytical, and authoritative.
        """
        
        # Call the latest supported Gemini model
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )
        
        ai_insight = response.text.strip()
        risk_level = "High" if is_anomaly else ("Medium" if variance < 90 else "Low")

    except Exception as e:
        ai_insight = f"Generative AI Error: {str(e)}. Fallback analysis: {'Anomaly detected. Immediate review required.' if is_anomaly else 'Metrics are within normal variance ranges.'}"
        risk_level = "High" if is_anomaly else "Low"

    return {
        "kpi_analyzed": kpi.name,
        "variance_percentage": round(variance, 2),
        "is_anomaly": is_anomaly,
        "ai_insight": ai_insight,
        "risk_level": risk_level,
        "model": "Isolation Forest + Gemini 3.6 Flash"
    }