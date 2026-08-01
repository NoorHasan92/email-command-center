# Incident Response Playbook

## Outage: OpenAI API Down
1. **Symptoms**: Spike in 429 or 5xx errors from OpenAI. Emails stuck in `PENDING` -> `FAILED` loop.
2. **Action**: 
   - No immediate action required for data integrity (queue absorbs the hit).
   - Once resolved, run `scripts/replay-failed.ts`.

## Outage: Database Unreachable
1. **Symptoms**: Health check `/api/health/ready` returns 503.
2. **Action**:
   - Check Neon DB dashboard for compute suspension or outages.
   - If DB corrupted, trigger Neon Point-In-Time Restore to branch, then promote branch to main.

## Outage: WhatsApp API Rate Limits
1. **Symptoms**: 429s from Meta Graph API.
2. **Action**:
   - Pause processing using `PAUSE_PIPELINE=true` env var.
   - Wait 1 hour, resume and run replay scripts.
