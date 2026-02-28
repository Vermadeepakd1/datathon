# API Smoke Tests

Base URL: `http://localhost:5000/api/v1`

## 1. Evaluate diagnostics

```bash
curl -X POST http://localhost:5000/api/v1/diagnostics/evaluate ^
  -H "Content-Type: application/json" ^
  -d "{\"age\":27,\"systolicBP\":118,\"diastolicBP\":76,\"bloodGlucose\":108,\"bodyTemp\":98.6,\"heartRate\":84,\"patientBloodGroup\":\"O+\"}"
```

## 2. Trigger hemorrhage alert

```bash
curl -X POST http://localhost:5000/api/v1/alerts/hemorrhage ^
  -H "Content-Type: application/json" ^
  -d "{\"patientBloodGroup\":\"O+\",\"location\":{\"type\":\"Point\",\"coordinates\":[-73.94,40.73]},\"radiusKm\":25,\"limit\":10,\"minHemoglobin\":12.5,\"patientRiskLevel\":\"high\"}"
```

## 3. Reveal donor contacts (admin-only)

```bash
curl -X POST http://localhost:5000/api/v1/alerts/<ALERT_ID>/reveal-donors ^
  -H "Content-Type: application/json" ^
  -H "x-admin-token: <ADMIN_ACCESS_TOKEN>" ^
  -d "{\"donorAnonIds\":[]}"
```

## 4. Donor consent status update

```bash
curl -X PATCH http://localhost:5000/api/v1/users/<USER_ID>/donor-status ^
  -H "Content-Type: application/json" ^
  -d "{\"donorConsent\":true,\"donorAvailability\":\"Ready-to-Donate\"}"
```

## 5. Add donor medical log

```bash
curl -X POST http://localhost:5000/api/v1/medical-logs ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"<USER_ID>\",\"hemoglobin\":13.1,\"chronicConditions\":[\"asthma\"]}"
```

## 6. Fetch donor medical history

```bash
curl http://localhost:5000/api/v1/medical-logs/user/<USER_ID>/history?limit=20
```
