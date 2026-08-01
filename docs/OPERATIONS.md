# Operations & Recovery

## Backups
- **Strategy**: We rely on Neon PostgreSQL Point-in-Time Recovery (PITR).
- **RPO (Recovery Point Objective)**: 5 minutes. Neon continuously archives WAL.
- **RTO (Recovery Time Objective)**: 15 minutes to branch or restore to a specific LSN/timestamp.

## Replaying Failed Webhooks
If a downstream API (OpenAI/WhatsApp) goes down, webhooks enter `FAILED` state.
To replay them:
1. SSH / Exec into the production environment.
2. Run `npx tsx scripts/replay-failed.ts`.

## Dashboards & Monitoring
- **Queue Growth**: Monitor the number of `PENDING` items in `WebhookEvent`. Alert if > 100 for 5 minutes.
- **Error Rate**: Monitor `FAILED` webhooks. Alert if > 5% failure rate in 1 hour.
- **Latency**: Filter logs by `pipelineMetrics`. Alert if AI Analyzer > 5s P99.
