import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * @file next.config.ts
 * @description Enhanced configuration for AetherRise SaaS.
 * Integrates Serwist for PWA capabilities (Goal 13) and optimized remote asset handling.
 */

const withSerwist = withSerwistInit({
  // Service Worker configuration
  swSrc: "src/app/sw.ts", 
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Goal 13: Auto-register the service worker
  register: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Optimization for Remote Images (Supabase & AI Generated Assets)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google Auth profile pictures
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // remove console logs in production for cleaner output
  },
};

export default withSerwist(nextConfig);