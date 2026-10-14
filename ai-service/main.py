import os
import io
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest
from google import genai
from openai import AsyncOpenAI
import PyPDF2
import docx
import pandas as pd

load_dotenv()

app = FastAPI(title="Strategic Planning System AI", version="7.0 (Explicit AI Routing)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_api_key = os.environ.get("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None

deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")
deepseek_client = AsyncOpenAI(api_key=deepseek_api_key, base_url="https://api.deepseek.com") if deepseek_api_key else None

async def extract_text_from_file(file: UploadFile):
    ext = file.filename.split('.')[-1].lower()
    content = await file.read()
    text = ""
    try:
        if ext in ['txt', 'csv']: text = content.decode('utf-8')
        elif ext == 'pdf': text = " ".join([page.extract_text() for page in PyPDF2.PdfReader(io.BytesIO(content)).pages if page.extract_text()])
        elif ext == 'docx': text = " ".join([p.text for p in docx.Document(io.BytesIO(content)).paragraphs])
        elif ext in ['xls', 'xlsx']: text = pd.read_excel(io.BytesIO(content)).to_string()
        else: text = f"[Binary File: {file.filename}]"
    except Exception as e:
        text = f"Error reading file: {str(e)}"
    return text[:15000]

class KPIPayload(BaseModel):
    name: str
    department: str = "Unassigned"
    target_value: float
    actual_value: float
    ai_choice: str = "gemini" # 'gemini' or 'deepseek'

@app.post("/api/predict")
async def predict_performance(kpi: KPIPayload):
    np.random.seed(42)
    historical_values = np.random.normal(loc=kpi.target_value, scale=kpi.target_value * 0.05, size=30)
    current_value = np.array([kpi.actual_value])
    all_values = np.concatenate([historical_values, current_value]).reshape(-1, 1)

    ml_model = IsolationForest(n_estimators=50, contamination=0.05, random_state=42)
    ml_model.fit(all_values)

    prediction = ml_model.predict(current_value.reshape(-1, 1))[0]
    variance = (kpi.actual_value / kpi.target_value) * 100
    is_anomaly = bool(prediction == -1)
    risk_level = "High" if (is_anomaly or variance < 75) else ("Medium" if variance < 95 else "Low")

    prompt = f"""
    You are an elite AI strategic advisor. Analyze this KPI:
    - Metric: {kpi.name} ({kpi.department})
    - Target: {kpi.target_value} | Actual: {kpi.actual_value} | Variance: {variance:.1f}%
    - Statistical Anomaly: {'Yes' if is_anomaly else 'No'}

    Provide your response in exactly two short sections:
    **Anomaly Detected**: [Briefly explain the variance and risk].
    **Recommended Steps**: [Provide 2 actionable steps for the department].
    """

    ai_insight = "AI processing failed."
    model_used = "None"

    if kpi.ai_choice == 'gemini' and gemini_client:
        try:
            loop = asyncio.get_event_loop()
            res = await asyncio.wait_for(loop.run_in_executor(None, lambda: gemini_client.models.generate_content(model="gemini-3.6-flash", contents=prompt)), timeout=4.0)
            ai_insight, model_used = res.text.strip(), "Google Gemini 3.6"
        except Exception as e:
            ai_insight = f"Gemini Error: {e}"
            
    elif kpi.ai_choice == 'deepseek' and deepseek_client:
        try:
            res = await asyncio.wait_for(deepseek_client.chat.completions.create(model="deepseek-chat", messages=[{"role": "user", "content": prompt}], max_tokens=150), timeout=5.0)
            ai_insight, model_used = res.choices[0].message.content.strip(), "DeepSeek AI"
        except Exception as e:
            ai_insight = f"DeepSeek Error: {e}"

    return {"kpi_analyzed": kpi.name, "variance_percentage": round(variance, 2), "is_anomaly": is_anomaly, "ai_insight": ai_insight, "risk_level": risk_level, "model": model_used}

@app.post("/api/workplan/analyze")
async def analyze_workplan(
    title: str = Form(...), department: str = Form(...), status: str = Form(...), ai_choice: str = Form(...), file: UploadFile = File(...)
):
    document_text = await extract_text_from_file(file)
    
    prompt = f"""
    You are an AI Document Auditor. The {department} department submitted a work plan titled '{title}'. Status: {status}.
    File content excerpt: {document_text}
    
    Provide your response in exactly two short sections:
    **Audit Finding**: [Briefly state if the document aligns with strategic goals and identify any anomaly/risk].
    **Recommended Steps**: [Provide 2 actionable recommendations based on the document].
    """

    ai_insight = "AI processing failed."
    model_used = "None"

    if ai_choice == 'gemini' and gemini_client:
        try:
            loop = asyncio.get_event_loop()
            res = await asyncio.wait_for(loop.run_in_executor(None, lambda: gemini_client.models.generate_content(model="gemini-3.6-flash", contents=prompt)), timeout=6.0)
            ai_insight, model_used = res.text.strip(), "Google Gemini 3.6"
        except Exception as e:
            ai_insight = f"Gemini Error: {e}"
            
    elif ai_choice == 'deepseek' and deepseek_client:
        try:
            res = await asyncio.wait_for(deepseek_client.chat.completions.create(model="deepseek-chat", messages=[{"role": "user", "content": prompt}], max_tokens=200), timeout=7.0)
            ai_insight, model_used = res.choices[0].message.content.strip(), "DeepSeek AI"
        except Exception as e:
            ai_insight = f"DeepSeek Error: {e}"

    return {"plan_title": title, "ai_insight": ai_insight, "model": model_used}