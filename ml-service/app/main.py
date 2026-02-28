from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query

from app.clinical_rules import apply_clinical_safety_override
from app.explainability import ExplainabilityEngine
from app.model_registry import ModelRegistry
from app.schemas import PredictRequest, PredictResponse
from app.training import MODEL_CHOICES, train_and_compare_models, train_and_save_model

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "maternal_model.joblib"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"
COMPARISON_PATH = BASE_DIR / "models" / "model_comparison.json"
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
    return {
        "success": True,
        "message": "ML service is healthy",
        "model_type": registry.model_type,
        "model_version": registry.model_version,
    }


@app.get("/")
def root() -> dict:
    return {
        "success": True,
        "message": "Maternal Guard ML service is running",
        "health_endpoint": "/health",
        "predict_endpoint": "/predict",
    }


@app.post("/train")
def train(model_type: str = Query("random_forest")) -> dict:
    global explainer
    if model_type not in MODEL_CHOICES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model_type. Allowed: {MODEL_CHOICES}",
        )

    metrics = train_and_save_model(
        MODEL_PATH,
        METRICS_PATH,
        DATASET_PATH,
        model_type=model_type,
    )
    registry.load()
    explainer = ExplainabilityEngine(registry.model, registry.feature_order)
    return {
        "success": True,
        "message": "Model retrained",
        "model_type": registry.model_type,
        "metrics": metrics,
    }


@app.post("/train/compare")
def train_compare() -> dict:
    global explainer
    comparison = train_and_compare_models(
        model_path=MODEL_PATH,
        metrics_path=METRICS_PATH,
        dataset_path=DATASET_PATH,
        comparison_path=COMPARISON_PATH,
    )
    registry.load()
    explainer = ExplainabilityEngine(registry.model, registry.feature_order)
    return {"success": True, "message": "Model comparison complete", "comparison": comparison}


@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest) -> PredictResponse:
    if explainer is None:
        raise RuntimeError("Model not ready. Retry in a moment.")

    vector = registry.to_vector(payload.model_dump())
    prediction = registry.predict(vector)
    feature_importance = explainer.explain_single(vector, prediction["predicted_class_index"])
    prediction, feature_importance, safety_override = apply_clinical_safety_override(
        payload.model_dump(), prediction, feature_importance
    )

    return PredictResponse(
        risk_level=prediction["risk_level"],
        risk_score=prediction["risk_score"],
        predicted_class_index=prediction["predicted_class_index"],
        class_probabilities=prediction["class_probabilities"],
        feature_importance=feature_importance,
        safety_override=safety_override,
        model_type=registry.model_type,
        model_version=registry.model_version,
    )
