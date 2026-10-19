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

app = FastAPI(title="Strategic Planning System AI", version="7.1 (Timeout Fix)")

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

async def extract_text_from_file(file: UploadFile) -> str:
    ext = file.filename.split('.')[-1].lower()
    content = await file.read()
    text = ""
    try:
        if ext in ['txt', 'csv']:
            text = content.decode('utf-8', errors='ignore')
        elif ext == 'pdf':
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = " ".join([page.extract_text() for page in reader.pages if page.extract_text()])
        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(content))
            text = " ".join([p.text for p in doc.paragraphs])
        elif ext in ['xls', 'xlsx']:
            df = pd.read_excel(io.BytesIO(content))
            text = df.to_string()
        else:
            text = f"[Binary Document Attached: {file.filename}]"
    except Exception as e:
        text = f"Error extracting content: {str(e)}"
    return text[:15000]

class KPIPayload(BaseModel):
    name: str
    department: str = "Unassigned"
    target_value: float
    actual_value: float
    ai_choice: str = "gemini"

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
    Analyze this KPI like you are talking casually to a coworker. Do not use fancy corporate jargon, and do not use markdown stars (**) for bolding.
    - Metric: {kpi.name}
    - Department: {kpi.department}
    - Target: {kpi.target_value} | Actual: {kpi.actual_value}
    - Variance: {variance:.1f}%
    - Statistical Anomaly: {'Yes' if is_anomaly else 'No'}

    Format your response in exactly two distinct sections:
    Anomaly Detected:
    [Explain what went wrong simply in 1-3 sentences].

    Recommended Steps:
    1. [First straightforward step].
    2. [Second straightforward step].
    """

    ai_insight = "Audit generation failed."
    model_used = "Ai Service not available"

    if kpi.ai_choice == "gemini" and gemini_client:
        try:
            loop = asyncio.get_event_loop()
            # Timeout wrapper removed so the AI can take as long as it needs
            res = await loop.run_in_executor(
                None,
                lambda: gemini_client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt
                )
            )
            ai_insight = res.text.strip()
            model_used = "Google Gemini"
        except Exception as e:
            ai_insight = f"Gemini Audit Error: {type(e).__name__} - {str(e)}"
            
    elif kpi.ai_choice == "deepseek" and deepseek_client:
        try:
            res = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=220
            )
            ai_insight = res.choices[0].message.content.strip()
            model_used = "DeepSeek AI"
        except Exception as e:
            ai_insight = f"DeepSeek Audit Error: {type(e).__name__} - {str(e)}"

    return {
        "kpi_analyzed": kpi.name,
        "variance_percentage": round(variance, 2),
        "is_anomaly": is_anomaly,
        "ai_insight": ai_insight,
        "risk_level": risk_level,
        "model": model_used
    }

@app.post("/api/workplan/analyze")
async def analyze_workplan(
    title: str = Form(...),
    department: str = Form(...),
    status: str = Form(...),
    ai_choice: str = Form(...),
    file: UploadFile = File(...)
):
    document_text = await extract_text_from_file(file)

    prompt = f"""
    Review this departmental work plan casually. Do not use corporate jargon, and do not use markdown stars (**) for bolding.
    - Initiative Title: {title}
    - Department: {department}
    - Current Operational Status: {status}

    Document Text Sample:
    ---
    {document_text}
    ---

    Format your response in exactly two distinct sections:
    Audit Finding:
    [Explain if the plan makes sense and point out any big risks in 1-2 simple sentences].

    Recommended Steps:
    1. [First straightforward action].
    2. [Second straightforward action].
    """

    ai_insight = "Document audit failed."
    model_used = "Ai Service not available"

    if ai_choice == "gemini" and gemini_client:
        try:
            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(
                None,
                lambda: gemini_client.models.generate_content(
                    model="gemini-3.6-flash",
                    contents=prompt
                )
            )
            ai_insight = res.text.strip()
            model_used = "Google Gemini"
        except Exception as e:
            ai_insight = f"Gemini Audit Error: {type(e).__name__} - {str(e)}"
            
    elif ai_choice == "deepseek" and deepseek_client:
        try:
            res = await deepseek_client.chat.completions.create(
                model="deepseek-chat",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=250
            )
            ai_insight = res.choices[0].message.content.strip()
            model_used = "DeepSeek AI"
        except Exception as e:
            ai_insight = f"DeepSeek Audit Error: {type(e).__name__} - {str(e)}"

    return {
        "plan_title": title,
        "ai_insight": ai_insight,
        "model": model_used
    }