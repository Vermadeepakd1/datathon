# Maternal-Guard & Life-Link Backend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Seed sample donors

```bash
npm run seed
```

## Seed 10k+ donor dataset (scalability)

```bash
npm run seed:large
```

Optional envs:

- `LARGE_SEED_COUNT` (default `10000`)

## Benchmark matchmaking scalability

```bash
npm run bench:scaling
```

Outputs a benchmark JSON report at `backend/reports/scalability_report.json`.

Optional envs:

- `BENCH_ITERATIONS` (default `120`)
- `BENCH_WARMUP` (default `10`)

## Core endpoints

- `POST /api/v1/users` create donor profile with GeoJSON location
- `GET /api/v1/users?limit=60&page=1&search=an` paginated donor listing for consent dashboard
- `PATCH /api/v1/users/:userId/donor-status` toggle consent/availability without deleting profile
- `POST /api/v1/medical-logs` insert hemoglobin/chronic condition log (anonymized)
- `GET /api/v1/medical-logs` list logs (filters: `userId`, `anonDonorId`, `limit`)
- `GET /api/v1/medical-logs/user/:userId/history` donor medical timeline + summary
- `POST /api/v1/diagnostics/evaluate` maternal risk API payload with `patientBloodGroup`
- `POST /api/v1/matchmaking/search` geospatial donor match (masked output)
- `POST /api/v1/alerts/hemorrhage` one-tap emergency search + alert creation
- `POST /api/v1/alerts/:alertId/reveal-donors` admin-only donor contact reveal (`x-admin-token`)

### Admin header for reveal/sensitive access

- Header key: `x-admin-token`
- Value from backend `.env`: `ADMIN_ACCESS_TOKEN`

## GeoJSON reminder

- Coordinates are `[longitude, latitude]`
- `location.type` must be `"Point"`

## Security notes

- Medical details are field-encrypted at rest (`AES-256-GCM`) before persistence.
- Matchmaking uses derived indicators (`hemoglobin`, eligibility flags) and returns masked donor identity by default.
