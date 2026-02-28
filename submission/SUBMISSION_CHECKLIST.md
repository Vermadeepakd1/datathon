# Submission Checklist

## Problem statement mapping

1. ML risk predictor with non-linear classifier options
- Status: Completed
- Evidence: `ml-service/scripts/train_model.py` (`--model-type`, `--compare`)
- Evidence: `ml-service/models/model_comparison.json`

2. Explainability (primary risk driver)
- Status: Completed
- Evidence: `ml-service/app/explainability.py`
- Evidence: `frontend/src/components/RiskResultCard.jsx`

3. Outlier handling (age, heart rate, vitals)
- Status: Completed
- Evidence: `ml-service/app/training.py` (`_clip_bounds_from_iqr`, `_apply_bounds`)

4. Bias mitigation across age groups
- Status: Completed
- Evidence: `ml-service/app/training.py` (`_age_group_weights`, `age_group_accuracy`)
- Evidence: `ml-service/models/metrics.json`

5. Donor schema with profile + location + consent
- Status: Completed
- Evidence: `backend/src/modules/users/user.model.js`

6. Medical logs with hemoglobin, chronic conditions, timestamp
- Status: Completed
- Evidence: `backend/src/modules/medicalLogs/medicalLog.model.js`

7. Data anonymization and medical encryption
- Status: Completed
- Evidence: `backend/src/utils/anonymize.js`
- Evidence: `backend/src/utils/medicalEncryption.js`

8. Matching algorithm (blood compatibility + hemoglobin + radius)
- Status: Completed
- Evidence: `backend/src/modules/matchmaking/matchmaking.service.js`

9. One-tap hemorrhage alert with masked donor results
- Status: Completed
- Evidence: `backend/src/modules/alerts/alerts.service.js`
- Evidence: `frontend/src/components/SosAlertPanel.jsx`

10. Admin-only donor contact reveal
- Status: Completed
- Evidence: `POST /api/v1/alerts/:alertId/reveal-donors` with `x-admin-token`

11. Consent management toggle
- Status: Completed
- Evidence: `PATCH /api/v1/users/:userId/donor-status`
- Evidence: `frontend/src/components/DonorStatusPanel.jsx`
- Evidence: paginated donor browser via `GET /api/v1/users?limit=&page=`

12. Scalability proof for 10,000+ donors
- Status: Completed
- Evidence: `backend/scripts/seed_large.js`
- Evidence: `backend/scripts/benchmark_scalability.js`
- Artifact: `backend/reports/scalability_report.json`

## Required deliverables

1. GitHub repository with README
- Status: Completed
- Evidence: root `README.md` + module READMEs

2. Live demo (2 minutes)
- Status: Completed (script ready)
- Evidence: `submission/DEMO_SCRIPT.md`

3. Presentation (4-5 slides)
- Status: Completed (content ready)
- Evidence: `submission/PRESENTATION_OUTLINE.md`

4. Model report PDF with F1, confusion matrix, feature importance
- Status: Completed
- Evidence: `ml-service/models/model_report.pdf`
