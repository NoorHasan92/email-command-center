# Backup, Recovery, and Data Retention Architecture

## 1. Database Backups (NeonDB)

Inbox Sentinel runs on Neon (Serverless Postgres). 
Neon provides **automated daily backups** and continuous WAL archiving by default.

- **Backup Frequency**: Continuous (Write-Ahead Logs) + Daily snapshots.
- **Retention Period**: Defaults to 7 days (Free Tier) or 14-30 days (Pro Tier).
- **Encryption**: Encrypted at rest automatically by Neon (AWS KMS).
- **Access Control**: Only accessible via Neon Console by authorized organization members.

## 2. Point-in-Time Recovery (PITR)

Neon supports PITR out-of-the-box. We can instantly branch our database or restore it to any specific second within the retention window.

### Safe Restore Strategy

**DO NOT RESTORE PRODUCTION DIRECTLY** without validation.

1. **Identify Incident**: Determine the exact timestamp (e.g. `2026-08-31 14:00:00 UTC`) before data corruption occurred.
2. **Freeze Writes**: If necessary, scale down background workers and block new signups to prevent split-brain states.
3. **Branch from History**: Use Neon's branch feature to create a temporary branch at the identified timestamp.
4. **Validation**: Connect a staging environment (or local branch) to the new Neon branch. Run the `/admin/system/integrity` checks to ensure the data is consistent and the corruption is gone.
5. **Restore**: If validated, use Neon's "Restore" feature (or promote the branch) to replace production.
6. **Resume**: Unfreeze writes and verify critical paths (Payments, AI routing).

## 3. Data Retention Categories & Cleanup

We retain data based on legal/operational necessity:

### Category A: Identity Data (Subject to Anonymization)
- `name`, `email`, `phoneNumber`, `telegramUsername`
- Automatically anonymized by `cleanup.service.ts` when an `AccountDeletionRequest` is fully processed.

### Category B: Financial & Audit Records (Permanent/7 Years)
- `Order`, `Payment`, `AdminAuditLog`, `TransactionalEmailLog` (Receipts)
- Retained indefinitely for tax, accounting, and security compliance.
- During account deletion, these are scrubbed of PII but the raw records (e.g., `amount`, `currency`) remain.

### Category C: Operational Telemetry (30 - 90 Days)
- `WebhookEvent`, `AuditLog` (Standard login logs), `AIUsageEvent`
- Safe for periodic cleanup. 

### Cleanup Job Architecture

Future implemention for Category C cleanup should run via a cron job (`/api/cron/retention`):
```typescript
await db.webhookEvent.deleteMany({
  where: {
    status: "PROCESSED",
    createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
  }
});
```
*Crucial Constraint*: Cleanup jobs must support dry-run modes, log total rows affected, and never indiscriminately delete `FAILED` events that are pending investigation.
