# Maternal-Guard & Life-Link

Datathon 2.0 submission for:
`Maternal-Guard & Life-Link: AI-Driven Maternal Care & Emergency Donor Network`

## Stack

- `frontend/`: React (Vite) + Tailwind CSS
- `backend/`: Node.js + Express + MongoDB (Mongoose)
- `ml-service/`: FastAPI + scikit-learn + XGBoost + SHAP

## Core capabilities

- Maternal risk prediction from vitals (`Age`, `Systolic BP`, `Diastolic BP`, `Blood Glucose`, `Body Temp`, `Heart Rate`)
- XAI feature importance with primary risk driver surfaced for clinicians
- Outlier handling and age-group bias monitoring in model training pipeline
- One-tap hemorrhage SOS that bypasses normal flow
- Blood-group compatible donor matchmaking with geospatial filtering and hemoglobin thresholding
- Privacy masking by default, with admin-only reveal flow
- Consent toggle and medical-log timeline with encrypted sensitive fields
- Paginated donor management for large datasets (10,000+ profiles)

## Run locally

1. Start backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

2. Start ML service
```bash
cd ml-service
pip install -r requirements.txt
python scripts/train_model.py --compare
uvicorn app.main:app --reload --port 8000
```

3. Start frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Scalability run (10,000+ donors)

```bash
cd backend
npm run seed:large
npm run bench:scaling
```

Benchmark report is written to `backend/reports/scalability_report.json`.

## Generated submission artifacts

- Model metrics JSON: `ml-service/models/metrics.json`
- Model comparison JSON: `ml-service/models/model_comparison.json`
- Model report PDF: `ml-service/models/model_report.pdf`
- Scalability benchmark JSON: `backend/reports/scalability_report.json`
- Demo and presentation support docs: `submission/`
- API smoke test commands: `submission/API_SMOKE_TESTS.md`
- Result summary: `submission/RESULTS.md`

## API highlights

- `POST /api/v1/diagnostics/evaluate`
- `POST /api/v1/matchmaking/search`
- `POST /api/v1/alerts/hemorrhage`
- `POST /api/v1/alerts/:alertId/reveal-donors` (`x-admin-token` required)
- `PATCH /api/v1/users/:userId/donor-status`
- `POST /api/v1/medical-logs`
- `GET /api/v1/medical-logs/user/:userId/history`
