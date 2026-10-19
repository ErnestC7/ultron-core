AI-Powered Strategic Planning & Balanced Scorecard System 

An enterprise-grade, full-stack web application designed to bridge the gap between strategic planning and operational execution. This platform replaces fragmented, manual spreadsheet tracking with a centralized, secure database and augments decision-making with a suite of Artificial Intelligence microservices.

Engineered specifically to support the 4-perspective Balanced Scorecard framework (Financial, Customer, Internal Processes, Learning & Growth), the system provides real-time performance visibility, predictive forecasting, and automated natural-language strategic audits.

 Core Features

*   **Role-Based Access Control (RBAC):** Secure 3-tier access (System Admin, Department Manager, Staff Viewer) with JWT authentication.
*   **The Balanced Scorecard Console:** Real-time KPI tracking with visual variance indicators (On Track, Caution, Critical Deficit).
*   **AI Anomaly Detection:** An unsupervised **Isolation Forest** algorithm automatically flags data entry errors and extreme operational deviations.
*   **Predictive Forecasting:** An **LSTM Neural Network** models temporal dependencies to forecast multi-period KPI trajectories.
*   **Dual-LLM Strategic Auditing:** Users can trigger instant, explainable document and KPI audits using either **Google Gemini** or **DeepSeek**. The AI translates mathematical variance into plain-language executive advice and actionable steps.
*   **Smart CSV Data Ingestion:** A bulk staging module that parses, validates, and commits large Excel/CSV datasets in a single transaction.

 Technology Stack

This project utilizes a decoupled, asynchronous microservice architecture:

Frontend (Presentation Tier)**
   React.js & Vite
   Tailwind CSS (Responsive UI)
   Lucide Icons

Backend (Application Tier)
   Node.js & Express.js
   JSON Web Tokens (JWT) & bcrypt

Database (Persistence Tier)
   PostgreSQL (ACID-compliant relational data storage)

AI Microservice (Inference Tier)
   Python 3.11 & FastAPI
   scikit-learn (Isolation Forest)
   TensorFlow / Keras (LSTM)
   OpenAI API SDK (DeepSeek routing) & Google GenAI SDK (Gemini 1.5/2.0 Flash)

Architecture Overview

The system enforces strict separation of concerns. The React client communicates with the Node.js API for secure database CRUD operations. When a user requests an AI Audit, the Node.js server asynchronously forwards the structured metric or document text to the Python FastAPI microservice, which executes the machine learning models and returns the generated strategic insights back to the client.

Authors

Ernest Chungu (Computer Science, University of Zambia)
Lazarous Ndhlovu (Computer Science, University of Zambia)

*Developed as a 4th-Year Computer Science Capstone Project (October 2026).*
