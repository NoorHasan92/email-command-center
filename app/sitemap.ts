import { MetadataRoute } from 'next';

const SITE_URL = 'https://mail.tars.homes';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/login', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/register', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/verify', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/refund', changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
