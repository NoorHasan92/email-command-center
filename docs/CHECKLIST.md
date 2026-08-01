# Pre-flight Production Checklist

- [ ] Run `npm audit` and verify dependencies.
- [ ] License check completed.
- [ ] Verify `NODE_ENV=production`.
- [ ] Ensure all required secrets are populated (checked by `/api/health/startup`).
- [ ] Ensure OAuth consent screen is Verified.
- [ ] Ensure Gmail Push endpoint is verified in Google Cloud Console.
- [ ] Ensure WhatsApp Webhook is verified in Meta Developer Portal.
- [ ] Verify Vercel / Cloudflare Rate Limiting is active.
- [ ] Connect structured logs (Pino) to Datadog/GCP/Vercel Log Drain.
- [ ] Configure uptime monitoring (e.g., BetterUptime, Datadog) to hit `/api/health/ready` every minute.
