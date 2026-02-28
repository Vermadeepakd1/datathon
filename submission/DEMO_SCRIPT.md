# 2-Minute Demo Script

## 0:00 - 0:20 | Problem and architecture

- Show app home screen.
- Explain two modules:
1. Maternal risk prediction.
2. Emergency donor matchmaking with privacy controls.

## 0:20 - 0:55 | Risk prediction + XAI

- Enter normal vitals in `Diagnostic Input`.
- Submit and show risk result card.
- Point out:
1. Risk level and score.
2. Primary risk driver (top explainability feature).

## 0:55 - 1:15 | Safety override for critical low vitals

- Enter extreme low vitals (example: very low BP or glucose).
- Submit and show high-risk override.
- Explain this is a clinical safety rule to avoid false reassurance.

## 1:15 - 1:45 | Hemorrhage SOS and donor masking

- Press `Activate Hemorrhage SOS`.
- Show returned compatible donors:
1. Masked alias.
2. Blood group.
3. Distance and health score.
- Confirm private contact details are hidden.

## 1:45 - 2:00 | Consent + medical logs + admin reveal

- Open `Consent & Medical Logs`.
- Toggle one donor to unavailable and add a medical log.
- Mention admin endpoint can reveal contacts only with `x-admin-token`.
