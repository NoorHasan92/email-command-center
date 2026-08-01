# Security Policy

## Supported Versions
Only the latest major version (v1.x) receives security updates.

## Reporting a Vulnerability
Please email security@inboxsentinel.app. We will respond within 48 hours.

## Rate Limiting & Auth
- All admin endpoints require `role === "ADMIN"`.
- All webhooks validate cryptographic signatures (Gmail HMAC / WhatsApp Hub Secret).
