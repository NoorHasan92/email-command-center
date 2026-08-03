import { MetadataRoute } from 'next';

const SITE_URL = 'https://mail.tars.homes';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/login', '/register', '/verify'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes as MetadataRoute.Sitemap;
}
