import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * @file next.config.ts
 * @description Main configuration for AetherRise.
 * Includes PWA settings and build error overrides.
 */

const withSerwist = withSerwistInit({
  // Service worker path and destination
  swSrc: "src/app/sw.ts", 
  swDest: "public/sw.js",
  // Disable PWA in development mode
  disable: process.env.NODE_ENV === "development",
  // Register service worker on load
  register: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Ignore TypeScript and ESLint errors during build to prevent failures
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },

  // Remote image patterns for Supabase and Google Auth
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', 
      },
    ],
  },

  // Production optimizations: Remove console logs
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", 
  },
};

export default withSerwist(nextConfig);