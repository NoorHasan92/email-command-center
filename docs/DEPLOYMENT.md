# Deployment Guide

## Environments
We support two deployment tracks: Staging and Production.

### Staging Deployment
- Deployed automatically via GitHub Actions on the `develop` branch.
- Target: Vercel Staging Environment.
- Database: Neon Staging Branch.
- Uses mock or non-production OpenAI keys and test WhatsApp recipients.

### Production Deployment
- Deployed upon creating a GitHub Release tag (e.g. `v1.0.0`).
- Target: Vercel Production Environment.
- Database: Neon Main Branch.
- Strict requirement: `NODE_ENV=production`

## Deployment Steps (Vercel)
1. Link Vercel project to GitHub repo.
2. Ensure Build Command is `npm run build`.
3. Configure all Environment Variables (refer to CHECKLIST.md).
4. Run `npm run deploy`.
