from __future__ import annotations

import logging
import numpy as np
import shap


logger = logging.getLogger(__name__)


class ExplainabilityEngine:
    def __init__(self, model, feature_order: list[str]) -> None:
        self.model = model
        self.feature_order = feature_order
        self.explainer = None
        self.explainer_mode = "feature_importance_fallback"

        try:
            self.explainer = shap.TreeExplainer(model)
            self.explainer_mode = "shap_tree"
        except Exception as error:
            logger.warning(
                "SHAP explainer init failed, using feature importance fallback: %s", error
            )

    def explain_single(self, vector: np.ndarray, class_index: int) -> list[dict]:
        class_values = None

        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(vector)

                if isinstance(shap_values, list):
                    class_values = np.abs(shap_values[class_index][0])
                elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                    class_values = np.abs(shap_values[0, :, class_index])
                else:
                    class_values = np.abs(shap_values[0])
            except Exception as error:
                logger.warning(
                    "SHAP explain_single failed, using feature importance fallback: %s", error
                )

        if class_values is None:
            class_values = np.abs(
                getattr(self.model, "feature_importances_", np.ones(len(self.feature_order)))
            )

        total = float(class_values.sum()) or 1.0
        normalized = class_values / total
        items = [
            {"feature": feature, "importance": float(round(value, 4))}
            for feature, value in zip(self.feature_order, normalized)
        ]
        return sorted(items, key=lambda item: item["importance"], reverse=True)
