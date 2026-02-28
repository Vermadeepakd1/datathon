from __future__ import annotations

import numpy as np
import shap


class ExplainabilityEngine:
    def __init__(self, model, feature_order: list[str]) -> None:
        self.model = model
        self.feature_order = feature_order
        self.explainer = shap.TreeExplainer(model)

    def explain_single(self, vector: np.ndarray, class_index: int) -> list[dict]:
        try:
            shap_values = self.explainer.shap_values(vector)

            if isinstance(shap_values, list):
                class_values = np.abs(shap_values[class_index][0])
            elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                class_values = np.abs(shap_values[0, :, class_index])
            else:
                class_values = np.abs(shap_values[0])
        except Exception:
            class_values = np.abs(getattr(self.model, "feature_importances_", np.ones(len(self.feature_order))))

        total = float(class_values.sum()) or 1.0
        normalized = class_values / total
        items = [
            {"feature": feature, "importance": float(round(value, 4))}
            for feature, value in zip(self.feature_order, normalized)
        ]
        return sorted(items, key=lambda item: item["importance"], reverse=True)
