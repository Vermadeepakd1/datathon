from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from app.explainability import ExplainabilityEngine
from app.model_registry import ModelRegistry
from app.schemas import PredictRequest, PredictResponse
from app.training import train_and_save_model

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "maternal_rf.joblib"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"
DATASET_PATH = BASE_DIR / "data" / "maternal_health_risk.csv"

app = FastAPI(title="Maternal Guard ML Service", version="1.0.0")
registry = ModelRegistry(MODEL_PATH, METRICS_PATH, DATASET_PATH)
explainer: ExplainabilityEngine | None = None


@app.on_event("startup")
def startup_event() -> None:
    global explainer
    registry.load()
    explainer = ExplainabilityEngine(registry.model, registry.feature_order)


@app.get("/health")
def health() -> dict:
    return {"success": True, "message": "ML service is healthy", "model_version": registry.model_version}


@app.post("/train")
def train() -> dict:
    global explainer
    metrics = train_and_save_model(MODEL_PATH, METRICS_PATH, DATASET_PATH)
    registry.load()
    explainer = ExplainabilityEngine(registry.model, registry.feature_order)
    return {"success": True, "message": "Model retrained", "metrics": metrics}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if explainer is None:
        raise RuntimeError("Model not ready. Retry in a moment.")

    vector = registry.to_vector(payload.model_dump())
    prediction = registry.predict(vector)
    feature_importance = explainer.explain_single(vector, prediction["predicted_class_index"])

    return PredictResponse(
        risk_level=prediction["risk_level"],
        risk_score=prediction["risk_score"],
        predicted_class_index=prediction["predicted_class_index"],
        feature_importance=feature_importance,
        model_version=registry.model_version,
    )
