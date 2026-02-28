import sys
from pathlib import Path

# Add parent directory to path so we can import app module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.training import train_and_save_model


def main() -> None:
    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "models" / "maternal_rf.joblib"
    metrics_path = base_dir / "models" / "metrics.json"
    dataset_path = base_dir / "data" / "maternal_health_risk.csv"
    metrics = train_and_save_model(model_path, metrics_path, dataset_path)
    print("Training complete.")
    print(metrics)


if __name__ == "__main__":
    main()
