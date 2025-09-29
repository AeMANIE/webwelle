import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Kommentiert aus für Server-Side Rendering
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  // Turbopack Root Directory - nur für lokale Entwicklung
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      root: process.cwd()
    }
  }),
  // Performance Optimierungen
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  // Modern JavaScript für bessere Performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Headers für bessere Caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
