# Results Snapshot

Generated on: 2026-02-28

## ML performance (active model)

- Model: `xgboost`
- Dataset rows: `1014`
- Accuracy: `0.8424`
- Weighted F1: `0.8408`
- Confusion matrix:
1. Low: `[67, 12, 2]`
2. Medium: `[11, 51, 5]`
3. High: `[2, 0, 53]`

Top feature importance:

1. `blood_glucose` (`0.3247`)
2. `systolic_bp` (`0.3132`)
3. `age` (`0.1348`)

Sources:

- `ml-service/models/metrics.json`
- `ml-service/models/model_report.pdf`

## Model comparison

1. `xgboost`: accuracy `0.8424`, weighted F1 `0.8408`
2. `random_forest`: accuracy `0.7833`, weighted F1 `0.7839`

Source:

- `ml-service/models/model_comparison.json`

## Scalability benchmark (10k donors)

- Users: `10000`
- Medical logs: `30000`
- Ready donors: `4231`
- Query latency (ms):
1. Avg: `136.98`
2. P50: `124.47`
3. P90: `209.44`
4. P95: `249.69`
5. P99: `342.87`

Source:

- `backend/reports/scalability_report.json`
