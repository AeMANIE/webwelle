import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-Side Rendering für bessere Performance
  trailingSlash: false,
  images: {
    unoptimized: true,
    // Optimierte Bildformate
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 Jahr
  },
  // Turbopack Root Directory - nur für lokale Entwicklung
  ...(process.env.NODE_ENV === 'development' && {
    turbopack: {
      root: process.cwd()
    }
  }),
  // Performance Optimierungen
  experimental: {
    optimizePackageImports: ['lucide-react', '@stripe/stripe-js'],
    // Modern bundling
    esmExternals: true,
  },
  // Optimierte Server-Komponenten
  serverExternalPackages: ['pg'],
  // Output file tracing
  outputFileTracingRoot: process.cwd(),
  // Modern JavaScript für bessere Performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Tree shaking optimieren
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? { properties: ['^data-testid$'] } : false,
  },
  // Bundle splitting optimieren
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Stripe komplett aus Bundle entfernen - nur on-demand laden
          stripe: {
            test: /[\\/]node_modules[\\/]@stripe[\\/]/,
            name: 'stripe',
            chunks: 'async', // Nur async chunks - nicht im initial bundle
            priority: 20,
          },
          // CSS in separaten Chunks
          styles: {
            test: /\.(css|scss|sass)$/,
            name: 'styles',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    return config;
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
      // Korrekte MIME-Types für CSS - verhindert MIME-Type Fehler
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Korrekte MIME-Types für JS
      {
        source: '/:path*\\.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
      // Statische Assets - lange Cache-Zeit (1 Jahr)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, s-maxage=31536000',
          },
          {
            key: 'Expires',
            value: new Date(Date.now() + 31536000 * 1000).toUTCString(),
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      // Bilder - mittlere Cache-Zeit
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=31536000',
          },
        ],
      },
      // CSS und JS - optimierte Cache-Zeit
      {
        source: '/:path*\\.(css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, s-maxage=31536000',
          },
          {
            key: 'Expires',
            value: new Date(Date.now() + 31536000 * 1000).toUTCString(),
          },
        ],
      },
      // HTML - kurze Cache-Zeit für Updates
      {
        source: '/:path*\\.(html|htm)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
