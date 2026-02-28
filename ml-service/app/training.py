from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split


FEATURE_ORDER = [
    "age",
    "systolic_bp",
    "diastolic_bp",
    "blood_glucose",
    "body_temp",
    "heart_rate",
]

RISK_MAP = {"low": 0, "medium": 1, "high": 2}
INVERSE_RISK_MAP = {value: key for key, value in RISK_MAP.items()}


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
        return renamed[FEATURE_ORDER + ["risk_level"]].copy()
    return _generate_dummy_dataset()


def _age_group_weights(ages: pd.Series) -> np.ndarray:
    bins = pd.cut(ages, bins=[0, 19, 35, 60], labels=["<=19", "20-35", "36-60"], include_lowest=True)
    counts = bins.value_counts().to_dict()
    n_groups = len(counts)
    total = len(ages)
    return np.array([total / (n_groups * counts[group]) for group in bins])


def _age_group_accuracy(ages: pd.Series, true_y: np.ndarray, pred_y: np.ndarray) -> dict[str, float]:
    bins = pd.cut(ages, bins=[0, 19, 35, 60], labels=["<=19", "20-35", "36-60"], include_lowest=True)
    metrics: dict[str, float] = {}
    for group in bins.unique():
        mask = bins == group
        if int(mask.sum()) == 0:
            continue
        metrics[str(group)] = round(float(accuracy_score(true_y[mask], pred_y[mask])), 4)
    return metrics


def train_and_save_model(
    model_path: Path,
    metrics_path: Path,
    dataset_path: Path,
    random_state: int = 42,
) -> dict:
    df = _load_or_create_dataset(dataset_path)
    df["risk_target"] = df["risk_level"].str.lower().map(RISK_MAP)

    if df["risk_target"].isna().any():
        raise ValueError("Found unknown risk levels in dataset. Allowed: low, medium, high")

    X = df[FEATURE_ORDER].copy()
    y = df["risk_target"].astype(int).to_numpy()

    x_train, x_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )

    clip_bounds = _clip_bounds_from_iqr(x_train)
    x_train = _apply_bounds(x_train, clip_bounds)
    x_test = _apply_bounds(x_test, clip_bounds)

    sample_weights = _age_group_weights(x_train["age"])
    model = RandomForestClassifier(
        n_estimators=350,
        random_state=random_state,
        max_depth=10,
        min_samples_leaf=2,
        class_weight="balanced_subsample",
    )
    model.fit(x_train, y_train, sample_weight=sample_weights)

    predictions = model.predict(x_test)
    probabilities = model.predict_proba(x_test)
    test_accuracy = float(accuracy_score(y_test, predictions))

    report = classification_report(
        y_test,
        predictions,
        output_dict=True,
        target_names=[INVERSE_RISK_MAP[0], INVERSE_RISK_MAP[1], INVERSE_RISK_MAP[2]],
    )
    age_bias_metrics = _age_group_accuracy(x_test["age"], y_test, predictions)

    metrics = {
        "model_version": datetime.now(tz=timezone.utc).isoformat(),
        "dataset_rows": int(len(df)),
        "test_accuracy": round(test_accuracy, 4),
        "age_group_accuracy": age_bias_metrics,
        "classification_report": report,
    }

    artifact = {
        "model": model,
        "clip_bounds": clip_bounds,
        "feature_order": FEATURE_ORDER,
        "risk_labels": INVERSE_RISK_MAP,
        "metrics": metrics,
        "example_prediction_probability_shape": list(probabilities.shape),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics
