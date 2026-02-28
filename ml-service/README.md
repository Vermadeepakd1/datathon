# Maternal Guard ML Microservice

## Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Useful checks:

- `GET /` service info
- `GET /health` active model status

## Train manually

```bash
python scripts/train_model.py --model-type random_forest
python scripts/train_model.py --model-type xgboost
python scripts/train_model.py --compare
```

Training writes:

- `models/metrics.json` (active model metrics: accuracy, F1, confusion matrix, feature importance)
- `models/model_report.pdf` (active model report PDF)
- `models/model_comparison.json` (RF vs XGBoost leaderboard)
- `models/model_report_random_forest.pdf` and `models/model_report_xgboost.pdf` after comparison

## Safety behavior

`/predict` applies a clinical safety override for extreme low vitals
(`systolic_bp`, `diastolic_bp`, `blood_glucose`, `body_temp`, `heart_rate`),
forcing `high` risk even if the model score is lower.

## API model selection

- `POST /train?model_type=random_forest`
- `POST /train?model_type=xgboost`
- `POST /train/compare` (trains both and activates best weighted-F1 model)

## Compatibility safeguard

If an existing serialized model was created with an incompatible scikit-learn version,
the service automatically retrains on startup to regenerate local-compatible artifacts.

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
