import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Kommentiert aus für Server-Side Rendering
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
