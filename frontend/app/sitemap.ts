import type { MetadataRoute } from 'next';
import { getBoards, getRecentThreads } from '@/lib/api';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticRoutes = ['', '/search', '/write', '/rules', '/privacy', '/report-guide', '/contact', '/advertise'];

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  try {
    const [boards, recentThreads] = await Promise.all([
      getBoards(),
      getRecentThreads('latest', 100),
    ]);

    for (const board of boards.items) {
      routes.push({
        url: `${siteUrl}/boards/${board.slug}`,
        lastModified: new Date(),
      });
    }

    routes.push({
      url: `${siteUrl}/boards/all`,
      lastModified: new Date(),
    });

    for (const thread of recentThreads.items) {
      routes.push({
        url: `${siteUrl}/threads/${thread.id}`,
        lastModified: new Date(thread.bumpedAt || thread.createdAt),
      });
    }
  } catch {
    routes.push({
      url: `${siteUrl}/boards/all`,
      lastModified: new Date(),
    });
  }

  return routes;
}
