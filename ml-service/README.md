# Maternal Guard ML Microservice

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Train manually

```bash
python scripts/train_model.py
```

Training writes:

- `models/metrics.json` (accuracy, F1, confusion matrix, feature importance)
- `models/model_report.pdf` (submission-ready report summary)

## Safety behavior

`/predict` applies a clinical safety override for extreme low vitals
(`systolic_bp`, `diastolic_bp`, `blood_glucose`, `body_temp`, `heart_rate`),
forcing `high` risk even if the model score is lower.

## Dataset

If `data/maternal_health_risk.csv` exists, it is used for training.
Expected columns:

- `Age`
- `SystolicBP`
- `DiastolicBP`
- `BS` (blood glucose)
- `BodyTemp`
- `HeartRate`
- `RiskLevel` (`low`, `medium`, `high`)

If no file is found, a synthetic maternal-risk style dataset is generated automatically.
