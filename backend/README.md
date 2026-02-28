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

## Core endpoints

- `POST /api/v1/users` create donor profile with GeoJSON location
- `PATCH /api/v1/users/:userId/donor-status` toggle consent/availability without deleting profile
- `POST /api/v1/medical-logs` insert hemoglobin/chronic condition log (anonymized)
- `POST /api/v1/diagnostics/evaluate` maternal risk API payload with `patientBloodGroup`
- `POST /api/v1/matchmaking/search` geospatial donor match (masked output)
- `POST /api/v1/alerts/hemorrhage` one-tap emergency search + alert creation
- `POST /api/v1/alerts/:alertId/reveal-donors` admin-only donor contact reveal (`x-admin-token`)

## GeoJSON reminder

- Coordinates are `[longitude, latitude]`
- `location.type` must be `"Point"`

## Security notes

- Medical details are field-encrypted at rest (`AES-256-GCM`) before persistence.
- Matchmaking uses derived indicators (`hemoglobin`, eligibility flags) and returns masked donor identity by default.
