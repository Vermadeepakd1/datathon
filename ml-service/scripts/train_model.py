import argparse
import sys
from pathlib import Path

# Add parent directory to path so we can import app module.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.training import MODEL_CHOICES, train_and_compare_models, train_and_save_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Train maternal risk model")
    parser.add_argument(
        "--model-type",
        default="random_forest",
        choices=MODEL_CHOICES,
        help="Model type to train",
    )
    parser.add_argument(
        "--compare",
        action="store_true",
        help="Train and compare RF vs XGBoost, then activate best model",
    )
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "models" / "maternal_model.joblib"
    metrics_path = base_dir / "models" / "metrics.json"
    dataset_path = base_dir / "data" / "maternal_health_risk.csv"
    comparison_path = base_dir / "models" / "model_comparison.json"

    if args.compare:
        comparison = train_and_compare_models(
            model_path=model_path,
            metrics_path=metrics_path,
            dataset_path=dataset_path,
            comparison_path=comparison_path,
        )
        print("Comparison complete.")
        print(comparison)
        return

    metrics = train_and_save_model(
        model_path=model_path,
        metrics_path=metrics_path,
        dataset_path=dataset_path,
        model_type=args.model_type,
    )
    print("Training complete.")
    print(metrics)


if __name__ == "__main__":
    main()
