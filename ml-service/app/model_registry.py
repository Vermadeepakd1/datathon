from __future__ import annotations

from pathlib import Path
from typing import Any
import warnings

import joblib
import numpy as np
from sklearn.exceptions import InconsistentVersionWarning

from app.training import FEATURE_ORDER, normalize_runtime_payload_units, train_and_save_model


class ModelRegistry:
    def __init__(self, model_path: Path, metrics_path: Path, dataset_path: Path) -> None:
        self.model_path = model_path
        self.metrics_path = metrics_path
        self.dataset_path = dataset_path
        self.artifact: dict[str, Any] | None = None

    def _load_artifact_with_warnings(self) -> tuple[dict[str, Any], bool]:
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always", InconsistentVersionWarning)
            artifact = joblib.load(self.model_path)

        version_warning_found = any(
            isinstance(warning.message, InconsistentVersionWarning) for warning in caught
        )
        return artifact, version_warning_found

    def load(self) -> None:
        if not self.model_path.exists():
            train_and_save_model(
                model_path=self.model_path,
                metrics_path=self.metrics_path,
                dataset_path=self.dataset_path,
            )
        artifact, version_warning = self._load_artifact_with_warnings()

        # Regenerate artifacts under the current sklearn runtime to avoid stale pickle compatibility.
        if version_warning:
            train_and_save_model(
                model_path=self.model_path,
                metrics_path=self.metrics_path,
                dataset_path=self.dataset_path,
            )
            artifact, _ = self._load_artifact_with_warnings()

        self.artifact = artifact

    @property
    def model(self):
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        return self.artifact["model"]

    @property
    def feature_order(self) -> list[str]:
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        return list(self.artifact.get("feature_order", FEATURE_ORDER))

    @property
    def clip_bounds(self) -> dict[str, tuple[float, float]]:
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        return self.artifact["clip_bounds"]

    @property
    def risk_labels(self) -> dict[int, str]:
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        raw = self.artifact["risk_labels"]
        return {int(key): value for key, value in raw.items()}

    @property
    def model_version(self) -> str:
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        return self.artifact.get("metrics", {}).get("model_version", "unknown")

    @property
    def model_type(self) -> str:
        if not self.artifact:
            raise RuntimeError("Model artifact is not loaded")
        return str(
            self.artifact.get("model_type")
            or self.artifact.get("metrics", {}).get("model_type")
            or "unknown"
        )

    def to_vector(self, payload: dict[str, float]) -> np.ndarray:
        normalized_payload = normalize_runtime_payload_units(payload)
        vector = np.array(
            [[float(normalized_payload[feature]) for feature in self.feature_order]],
            dtype=float,
        )
        for index, feature in enumerate(self.feature_order):
            lower, upper = self.clip_bounds[feature]
            vector[:, index] = np.clip(vector[:, index], lower, upper)
        return vector

    def predict(self, vector: np.ndarray) -> dict[str, Any]:
        probabilities = self.model.predict_proba(vector)[0]
        predicted_class = int(np.argmax(probabilities))
        risk_level = self.risk_labels[predicted_class]
        risk_score = float(np.round(probabilities[predicted_class] * 100, 2))
        class_probabilities = {
            self.risk_labels.get(index, str(index)): float(np.round(probability * 100, 2))
            for index, probability in enumerate(probabilities)
        }
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "predicted_class_index": predicted_class,
            "class_probabilities": class_probabilities,
            "probabilities": probabilities,
        }
