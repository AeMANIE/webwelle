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
  // Turbopack Konfiguration - leere Config für Production (webpack wird verwendet)
  turbopack: process.env.NODE_ENV === 'development' ? {
    root: process.cwd()
  } : {},
  // Performance Optimierungen
  experimental: {
    // lucide-react entfernt, da es Probleme mit Icon-Imports verursacht
    optimizePackageImports: ['@stripe/stripe-js', 'lucide-react', 'framer-motion'],
    // Modern bundling
    esmExternals: true,
    // Build Performance Optimierungen
    webpackBuildWorker: true,
  },
  // Optimierte Server-Komponenten
  serverExternalPackages: ['pg', 'pdfkit', 'fontkit'],
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
    if (!isServer && !dev) {
      config.target = ['web', 'es2022'];

      config.cache = {
        type: 'filesystem',
      };

      config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            stripe: {
              test: /[\\/]node_modules[\\/]@stripe[\\/]/,
              name: 'stripe',
              chunks: 'async',
              priority: 20,
            },
            gsap: {
              test: /[\\/]node_modules[\\/]gsap[\\/]/,
              name: 'gsap',
              chunks: 'async',
              priority: 18,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 16,
            },
            styles: {
              test: /\.(css|scss|sass)$/,
              name: 'styles',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              maxSize: 244000,
            },
          },
      };

      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
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
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // CSS-Dateien in chunks mit korrektem MIME-Type (MUSS VOR JS-Header stehen!)
      {
        source: '/_next/static/chunks/(.*)\\.css',
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
      // Alle JS-Dateien in chunks mit korrektem MIME-Type
      {
        source: '/_next/static/chunks/(.*)\\.js',
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
      // Videos aus /public
      {
        source: '/:path*\\.(mp4|webm)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Bilder aus /public
      {
        source: '/:path*\\.(png|jpg|jpeg|gif|webp|svg|ico)',
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
