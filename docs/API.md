# API Reference

## Health
- `GET /api/health/live`: Returns 200 OK. Used by Load Balancer for liveness probes.
- `GET /api/health/ready`: Returns 200 OK if Database is reachable. Used for readiness probes.
- `GET /api/health/startup`: Returns 200 OK if secrets are valid and DB is reachable. Used by Kubernetes/Vercel startup probes.

## Webhooks
- `POST /api/webhooks/gmail`: Gmail Pub/Sub push endpoint.
- `POST /api/webhooks/whatsapp`: WhatsApp Cloud API webhook endpoint.

## Admin
- `GET /api/rules/export`: Export all learning rules.
- `POST /api/rules/import`: Import learning rules.
