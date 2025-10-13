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
  // Headers für bessere Caching und MIME-Type Korrektur
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
      // Alle CSS-Dateien mit korrektem MIME-Type
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Alle JS-Dateien mit korrektem MIME-Type
      {
        source: '/_next/static/chunks/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Statische Assets - optimierte Cache-Strategie
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Bilder - mittlere Cache-Zeit
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
