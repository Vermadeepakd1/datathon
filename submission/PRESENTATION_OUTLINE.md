# Presentation Outline (5 Slides)

## Slide 1: Problem and impact

- Rural maternal emergencies lose the golden hour.
- Postpartum hemorrhage needs instant donor response.
- Goal: proactive risk triage + rapid donor network activation.

## Slide 2: System architecture

- Frontend: React + Tailwind health-worker interface.
- Backend: Express + MongoDB for diagnostics, alerts, donor matching.
- ML microservice: FastAPI + RF/XGBoost + SHAP explainability.

## Slide 3: ML module quality and safety

- Input features: age, BP, glucose, temperature, heart rate.
- Preprocessing: unit normalization + IQR outlier clipping.
- Bias mitigation: age-group weighting + per-group accuracy.
- Clinical safeguard: extreme low-vitals override to high risk.

## Slide 4: Life-Link donor network

- GeoJSON donor profiles + medical log timeline.
- Matching filters:
1. Blood compatibility.
2. Radius proximity.
3. Hemoglobin >= 12.5.
4. Disqualifying chronic conditions.
- Privacy: masked donors first, admin-only contact reveal.

## Slide 5: Results, scalability, and next steps

- Model report with F1, confusion matrix, feature importance (PDF).
- 10,000+ donor seed + scalability benchmark report.
- Next steps: hospital integrations, SMS/WhatsApp dispatch, audit trails.
