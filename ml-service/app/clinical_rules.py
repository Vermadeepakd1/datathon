from __future__ import annotations

from typing import Any

from app.training import normalize_runtime_payload_units


LOW_DANGER_RULES = [
    {
        "feature": "systolic_bp",
        "threshold": 85.0,
        "direction": "low",
        "rationale": "Severe hypotension can reduce maternal organ perfusion.",
    },
    {
        "feature": "diastolic_bp",
        "threshold": 50.0,
        "direction": "low",
        "rationale": "Very low diastolic pressure indicates critical circulatory risk.",
    },
    {
        "feature": "blood_glucose",
        "threshold": 60.0,
        "direction": "low",
        "rationale": "Severe hypoglycemia can cause maternal and fetal compromise.",
    },
    {
        "feature": "body_temp",
        "threshold": 95.0,
        "direction": "low",
        "rationale": "Hypothermia is an obstetric emergency sign.",
    },
    {
        "feature": "heart_rate",
        "threshold": 50.0,
        "direction": "low",
        "rationale": "Severe bradycardia may indicate hemodynamic instability.",
    },
]


def _deviation_ratio(observed: float, threshold: float, direction: str) -> float:
    if direction == "low":
        return max(0.0, (threshold - observed) / threshold)
    return max(0.0, (observed - threshold) / threshold)


def _rebalance_probabilities(existing: dict[str, float], forced_high_score: float) -> dict[str, float]:
    high_score = round(min(99.0, max(0.0, forced_high_score)), 2)
    remaining = round(100.0 - high_score, 2)
    low = float(existing.get("low", 0.0))
    medium = float(existing.get("medium", 0.0))
    base = low + medium
    if base <= 0:
        return {"low": round(remaining / 2, 2), "medium": round(remaining / 2, 2), "high": high_score}

    low_new = round((remaining * low) / base, 2)
    medium_new = round(remaining - low_new, 2)
    return {"low": low_new, "medium": medium_new, "high": high_score}


def _prioritize_feature(feature_importance: list[dict[str, Any]], feature_name: str) -> list[dict[str, Any]]:
    ordered = [dict(item) for item in feature_importance]
    index = next((i for i, item in enumerate(ordered) if item.get("feature") == feature_name), None)
    if index is None:
        return [{"feature": feature_name, "importance": 1.0}, *ordered]

    target = ordered.pop(index)
    top_importance = max([float(item.get("importance", 0.0)) for item in ordered], default=0.0)
    target["importance"] = round(max(float(target.get("importance", 0.0)), top_importance + 0.0001), 4)
    return [target, *ordered]


def apply_clinical_safety_override(
    payload: dict[str, float], prediction: dict[str, Any], feature_importance: list[dict[str, Any]]
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any] | None]:
    normalized = normalize_runtime_payload_units(payload)
    triggers: list[dict[str, Any]] = []

    for rule in LOW_DANGER_RULES:
        observed = float(normalized[rule["feature"]])
        threshold = float(rule["threshold"])
        direction = rule["direction"]
        breached = observed <= threshold if direction == "low" else observed >= threshold
        if not breached:
            continue
        triggers.append(
            {
                "feature": rule["feature"],
                "observed": round(observed, 3),
                "threshold": threshold,
                "direction": direction,
                "rationale": rule["rationale"],
                "_severity": _deviation_ratio(observed, threshold, direction),
            }
        )

    if not triggers:
        return prediction, feature_importance, None

    triggers.sort(key=lambda item: item["_severity"], reverse=True)
    primary_driver = triggers[0]["feature"]
    for item in triggers:
        item.pop("_severity", None)

    updated_prediction = dict(prediction)
    forced_high_score = max(float(prediction.get("risk_score", 0.0)), 92.0 + (len(triggers) - 1) * 1.5)
    updated_prediction["risk_level"] = "high"
    updated_prediction["risk_score"] = round(min(99.0, forced_high_score), 2)
    updated_prediction["class_probabilities"] = _rebalance_probabilities(
        prediction.get("class_probabilities", {}),
        updated_prediction["risk_score"],
    )

    adjusted_importance = _prioritize_feature(feature_importance, primary_driver)
    safety_override = {
        "applied": True,
        "reason": "Clinical safety override for extreme low-vital risk",
        "primary_driver": primary_driver,
        "triggers": triggers,
    }
    return updated_prediction, adjusted_importance, safety_override
