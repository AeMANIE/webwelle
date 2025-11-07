import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-Side Rendering für bessere Performance
  trailingSlash: false,
  // Standalone output für Docker (reduziert Image-Größe)
  output: 'standalone',
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
    // Build Performance Optimierungen
    webpackBuildWorker: true,
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
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Modern JavaScript target für bessere Performance
      config.target = ['web', 'es2022'];
      
      // Build Performance Optimierungen - Cache nur in Production
      if (!dev) {
        config.cache = {
          type: 'filesystem',
        };
      }
      
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          // Stripe komplett aus Bundle entfernen - nur on-demand laden
          stripe: {
            test: /[\\/]node_modules[\\/]@stripe[\\/]/,
            name: 'stripe',
            chunks: 'async', // Nur async chunks - nicht im initial bundle
            priority: 20,
          },
          // GSAP in separaten Chunk - nur async laden
          gsap: {
            test: /[\\/]node_modules[\\/]gsap[\\/]/,
            name: 'gsap',
            chunks: 'async', // Nur async - nicht im initial bundle
            priority: 18,
          },
          // React und React-DOM
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 16,
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
            maxSize: 244000,
          },
        },
      };
      
      // Tree shaking optimieren (nur in Production)
      if (!dev) {
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
        // Build Performance: Parallele Module-Verarbeitung
        config.optimization.moduleIds = 'deterministic';
        config.optimization.chunkIds = 'deterministic';
      }
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
            value: 'text/css',
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
            value: 'application/javascript',
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
