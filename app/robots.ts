import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/limits', '/pricing', '/privacy', '/terms', '/security'],
        disallow: ['/admin/', '/api/', '/chat/'],
      },
    ],
    sitemap: 'https://chatinalabs.ai/sitemap.xml',
  }
}
