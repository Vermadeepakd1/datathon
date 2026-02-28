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
