# Maternal-Guard & Life-Link

End-to-end Datathon scaffold with:

- `backend/`: Node.js + Express + MongoDB (Mongoose)
- `ml-service/`: FastAPI + scikit-learn + SHAP
- `frontend/`: React (Vite) + Tailwind CSS

## 1. Start backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## 2. Start ML service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 3. Start frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Optional seed data

```bash
cd backend
npm run seed
```

## High-level flow

1. Health worker submits vitals to `/diagnostics/evaluate`.
2. Backend calls ML service `/predict` and stores result with explainability.
3. SOS button triggers `/alerts/hemorrhage`.
4. Matchmaking pipeline returns masked compatible donors by radius + hemoglobin thresholds.
5. Admin uses token to reveal contacts only when needed.

## Added compliance features

- ML training now exports confusion matrix + feature importance to `ml-service/models/metrics.json`.
- A model report PDF is auto-generated at `ml-service/models/model_report.pdf`.
- Medical-log sensitive fields are encrypted at rest before persistence.
- Donor consent/availability can be toggled via `PATCH /api/v1/users/:userId/donor-status` and frontend UI.
