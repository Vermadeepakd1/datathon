from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

from app.reporting import generate_model_report_pdf

FEATURE_ORDER = [
    "age",
    "systolic_bp",
    "diastolic_bp",
    "blood_glucose",
    "body_temp",
    "heart_rate",
]

MODEL_CHOICES = ("random_forest", "xgboost")
RISK_MAP = {"low": 0, "medium": 1, "high": 2}
INVERSE_RISK_MAP = {value: key for key, value in RISK_MAP.items()}


def _normalize_risk_label(raw_label: object) -> str | None:
    label = str(raw_label).strip().lower()
    if not label:
        return None

    normalized = " ".join(label.replace("-", " ").replace("_", " ").split())
    alias_map = {
        "low": "low",
        "low risk": "low",
        "mid": "medium",
        "medium": "medium",
        "moderate": "medium",
        "mid risk": "medium",
        "medium risk": "medium",
        "moderate risk": "medium",
        "high": "high",
        "high risk": "high",
        "severe": "high",
        "severe risk": "high",
    }
    return alias_map.get(normalized)


def _normalize_blood_glucose_series(series: pd.Series) -> tuple[pd.Series, str]:
    # Kaggle maternal dataset BS is often in mmol/L (typically 6-19).
    # Canonical model unit is mg/dL; convert when values indicate mmol/L scale.
    finite = pd.to_numeric(series, errors="coerce")
    median_value = float(finite.median(skipna=True))
    if np.isfinite(median_value) and median_value <= 30:
        return finite * 18.0, "mmol_to_mgdl"
    return finite, "mgdl"


def _normalize_body_temp_series(series: pd.Series) -> tuple[pd.Series, str]:
    finite = pd.to_numeric(series, errors="coerce")
    median_value = float(finite.median(skipna=True))
    if np.isfinite(median_value) and 20 <= median_value <= 45:
        return (finite * 9.0 / 5.0) + 32.0, "celsius_to_fahrenheit"
    return finite, "fahrenheit"


def normalize_runtime_payload_units(payload: dict[str, float]) -> dict[str, float]:
    normalized = dict(payload)

    blood_glucose = float(normalized["blood_glucose"])
    if 0 < blood_glucose <= 30:
        normalized["blood_glucose"] = blood_glucose * 18.0

    body_temp = float(normalized["body_temp"])
    if 20 <= body_temp <= 45:
        normalized["body_temp"] = (body_temp * 9.0 / 5.0) + 32.0

    return normalized


def _clip_bounds_from_iqr(df: pd.DataFrame) -> dict[str, tuple[float, float]]:
    bounds: dict[str, tuple[float, float]] = {}
    for column in FEATURE_ORDER:
        q1 = df[column].quantile(0.25)
        q3 = df[column].quantile(0.75)
        iqr = q3 - q1
        lower = float(q1 - 1.5 * iqr)
        upper = float(q3 + 1.5 * iqr)
        bounds[column] = (lower, upper)
    return bounds


def _apply_bounds(df: pd.DataFrame, bounds: dict[str, tuple[float, float]]) -> pd.DataFrame:
    clipped = df.copy()
    for column, (lower, upper) in bounds.items():
        clipped[column] = clipped[column].clip(lower=lower, upper=upper)
    return clipped


def _generate_dummy_dataset(n_rows: int = 1400, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    age = rng.integers(15, 46, size=n_rows)
    systolic_bp = rng.normal(123, 18, size=n_rows).clip(80, 220)
    diastolic_bp = rng.normal(78, 12, size=n_rows).clip(50, 140)
    blood_glucose = rng.normal(112, 38, size=n_rows).clip(55, 360)
    body_temp = rng.normal(98.7, 1.8, size=n_rows).clip(94, 106)
    heart_rate = rng.normal(92, 20, size=n_rows).clip(45, 210)

    risk_score = np.zeros(n_rows)
    risk_score += ((age < 18) | (age > 35)).astype(int) * 1.0
    risk_score += (systolic_bp > 140).astype(int) * 1.7
    risk_score += (diastolic_bp > 90).astype(int) * 1.6
    risk_score += (blood_glucose > 140).astype(int) * 1.9
    risk_score += (body_temp > 100.4).astype(int) * 1.3
    risk_score += (heart_rate > 120).astype(int) * 1.4
    risk_score += rng.normal(0, 0.35, n_rows)

    labels = np.where(risk_score < 1.8, "low", np.where(risk_score < 3.8, "medium", "high"))

    return pd.DataFrame(
        {
            "age": age,
            "systolic_bp": systolic_bp,
            "diastolic_bp": diastolic_bp,
            "blood_glucose": blood_glucose,
            "body_temp": body_temp,
            "heart_rate": heart_rate,
            "risk_level": labels,
        }
    )


def _load_or_create_dataset(dataset_path: Path) -> pd.DataFrame:
    if dataset_path.exists():
        raw = pd.read_csv(dataset_path)
        renamed = raw.rename(
            columns={
                "Age": "age",
                "SystolicBP": "systolic_bp",
                "DiastolicBP": "diastolic_bp",
                "BS": "blood_glucose",
                "BodyTemp": "body_temp",
                "HeartRate": "heart_rate",
                "RiskLevel": "risk_level",
            }
        )
        missing = [column for column in FEATURE_ORDER + ["risk_level"] if column not in renamed.columns]
        if missing:
            raise ValueError(f"Dataset is missing required columns: {missing}")
        normalized = renamed[FEATURE_ORDER + ["risk_level"]].copy()
        normalized["blood_glucose"], glucose_transform = _normalize_blood_glucose_series(
            normalized["blood_glucose"]
        )
        normalized["body_temp"], temp_transform = _normalize_body_temp_series(normalized["body_temp"])
        normalized.attrs["unit_transforms"] = {
            "blood_glucose": glucose_transform,
            "body_temp": temp_transform,
        }
        return normalized

    generated = _generate_dummy_dataset()
    generated.attrs["unit_transforms"] = {
        "blood_glucose": "mgdl",
        "body_temp": "fahrenheit",
    }
    return generated


def _age_group_weights(ages: pd.Series) -> np.ndarray:
    bins = pd.cut(
        ages, bins=[-np.inf, 19, 35, np.inf], labels=["<=19", "20-35", "36+"], include_lowest=True
    )
    counts = bins.value_counts(dropna=True).to_dict()
    if not counts:
        return np.ones(len(ages))

    n_groups = len(counts)
    total = len(ages)
    weights = []
    for group in bins:
        if pd.isna(group):
            weights.append(1.0)
        else:
            weights.append(total / (n_groups * counts[group]))
    return np.array(weights, dtype=float)


def _age_group_accuracy(ages: pd.Series, true_y: np.ndarray, pred_y: np.ndarray) -> dict[str, float]:
    bins = pd.cut(
        ages, bins=[-np.inf, 19, 35, np.inf], labels=["<=19", "20-35", "36+"], include_lowest=True
    )
    metrics: dict[str, float] = {}
    for group in bins.dropna().unique():
        mask = bins == group
        if int(mask.sum()) == 0:
            continue
        metrics[str(group)] = round(float(accuracy_score(true_y[mask], pred_y[mask])), 4)
    return metrics


def _build_model(model_type: str, random_state: int):
    if model_type == "random_forest":
        return RandomForestClassifier(
            n_estimators=350,
            random_state=random_state,
            max_depth=10,
            min_samples_leaf=2,
            class_weight="balanced_subsample",
        )

    if model_type == "xgboost":
        try:
            from xgboost import XGBClassifier
        except ImportError as error:
            raise ValueError(
                "xgboost is not installed in this environment. Install dependencies first."
            ) from error

        return XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            n_estimators=420,
            learning_rate=0.05,
            max_depth=6,
            min_child_weight=2,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_lambda=1.2,
            eval_metric="mlogloss",
            random_state=random_state,
        )

    raise ValueError(f"Unsupported model_type: {model_type}. Allowed: {MODEL_CHOICES}")


def _normalize_model_type(model_type: str) -> str:
    normalized = str(model_type).strip().lower()
    if normalized not in MODEL_CHOICES:
        raise ValueError(f"Unsupported model_type: {model_type}. Allowed: {MODEL_CHOICES}")
    return normalized


def train_and_save_model(
    model_path: Path,
    metrics_path: Path,
    dataset_path: Path,
    random_state: int = 42,
    model_type: str = "random_forest",
    report_path: Path | None = None,
) -> dict:
    selected_model_type = _normalize_model_type(model_type)
    df = _load_or_create_dataset(dataset_path)
    df["risk_level_normalized"] = df["risk_level"].map(_normalize_risk_label)
    df["risk_target"] = df["risk_level_normalized"].map(RISK_MAP)

    if df["risk_target"].isna().any():
        unknown_labels = sorted(
            {str(value) for value in df.loc[df["risk_target"].isna(), "risk_level"].dropna().unique()}
        )
        raise ValueError(
            "Found unknown risk levels in dataset. "
            "Allowed canonical classes are low/medium/high. "
            f"Unknown values found: {unknown_labels}"
        )

    X = df[FEATURE_ORDER].copy()
    y = df["risk_target"].astype(int).to_numpy()
    x_train, x_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )

    clip_bounds = _clip_bounds_from_iqr(x_train)
    x_train = _apply_bounds(x_train, clip_bounds)
    x_test = _apply_bounds(x_test, clip_bounds)

    sample_weights = _age_group_weights(x_train["age"])
    model = _build_model(selected_model_type, random_state)
    model.fit(x_train, y_train, sample_weight=sample_weights)

    predictions = model.predict(x_test)
    probabilities = model.predict_proba(x_test)
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1, 2])
    test_accuracy = float(accuracy_score(y_test, predictions))

    report = classification_report(
        y_test,
        predictions,
        output_dict=True,
        target_names=[INVERSE_RISK_MAP[0], INVERSE_RISK_MAP[1], INVERSE_RISK_MAP[2]],
    )
    weighted_f1 = float(report["weighted avg"]["f1-score"])
    age_bias_metrics = _age_group_accuracy(x_test["age"], y_test, predictions)

    raw_importances = np.abs(getattr(model, "feature_importances_", np.zeros(len(FEATURE_ORDER))))
    total_importance = float(np.sum(raw_importances)) or 1.0
    feature_importance = [
        {"feature": feature, "importance": float(round(value / total_importance, 4))}
        for feature, value in zip(FEATURE_ORDER, raw_importances)
    ]
    feature_importance.sort(key=lambda item: item["importance"], reverse=True)

    unit_transforms = df.attrs.get("unit_transforms", {})
    metrics = {
        "model_version": datetime.now(tz=timezone.utc).isoformat(),
        "model_type": selected_model_type,
        "dataset_rows": int(len(df)),
        "test_accuracy": round(test_accuracy, 4),
        "weighted_f1": round(weighted_f1, 4),
        "feature_units": {
            "blood_glucose": "mg/dL",
            "body_temp": "F",
            "detected_transforms": {
                "blood_glucose": unit_transforms.get("blood_glucose", "unknown"),
                "body_temp": unit_transforms.get("body_temp", "unknown"),
            },
        },
        "age_group_accuracy": age_bias_metrics,
        "classification_report": report,
        "confusion_matrix": {
            "labels": ["low", "medium", "high"],
            "values": matrix.tolist(),
        },
        "feature_importance": feature_importance,
    }

    artifact = {
        "model": model,
        "model_type": selected_model_type,
        "clip_bounds": clip_bounds,
        "feature_order": FEATURE_ORDER,
        "risk_labels": INVERSE_RISK_MAP,
        "metrics": metrics,
        "example_prediction_probability_shape": list(probabilities.shape),
    }

    resolved_report_path = report_path or (model_path.parent / "model_report.pdf")
    model_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(artifact, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    generate_model_report_pdf(
        output_path=resolved_report_path,
        metrics=metrics,
        confusion_matrix_values=matrix.tolist(),
        feature_importance=feature_importance,
    )
    return metrics


def train_and_compare_models(
    model_path: Path,
    metrics_path: Path,
    dataset_path: Path,
    comparison_path: Path | None = None,
    model_types: Iterable[str] = MODEL_CHOICES,
    random_state: int = 42,
) -> dict:
    resolved_comparison_path = comparison_path or (model_path.parent / "model_comparison.json")
    resolved_report_path = model_path.parent / "model_report.pdf"

    leaderboard = []
    for model_type in model_types:
        selected_model_type = _normalize_model_type(model_type)
        candidate_model_path = model_path.parent / f"maternal_{selected_model_type}.joblib"
        candidate_metrics_path = model_path.parent / f"metrics_{selected_model_type}.json"
        candidate_report_path = model_path.parent / f"model_report_{selected_model_type}.pdf"

        metrics = train_and_save_model(
            model_path=candidate_model_path,
            metrics_path=candidate_metrics_path,
            dataset_path=dataset_path,
            random_state=random_state,
            model_type=selected_model_type,
            report_path=candidate_report_path,
        )

        leaderboard.append(
            {
                "model_type": selected_model_type,
                "weighted_f1": float(metrics["classification_report"]["weighted avg"]["f1-score"]),
                "accuracy": float(metrics["test_accuracy"]),
                "metrics_path": str(candidate_metrics_path),
                "model_path": str(candidate_model_path),
                "report_path": str(candidate_report_path),
            }
        )

    leaderboard.sort(key=lambda row: row["weighted_f1"], reverse=True)
    best = leaderboard[0]

    shutil.copyfile(best["model_path"], model_path)
    shutil.copyfile(best["metrics_path"], metrics_path)
    shutil.copyfile(best["report_path"], resolved_report_path)

    result = {
        "generated_at": datetime.now(tz=timezone.utc).isoformat(),
        "selected_model_type": best["model_type"],
        "selection_metric": "weighted_f1",
        "leaderboard": leaderboard,
        "active_model_path": str(model_path),
        "active_metrics_path": str(metrics_path),
        "active_report_path": str(resolved_report_path),
    }
    resolved_comparison_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result
