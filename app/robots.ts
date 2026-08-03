import { MetadataRoute } from 'next';

const SITE_URL = 'https://mail.tars.homes';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/verify'],
      disallow: [
        '/admin',
        '/alerts',
        '/analytics',
        '/dashboard',
        '/inbox',
        '/integrations',
        '/rules',
        '/settings',
        '/onboarding',
        '/api',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
