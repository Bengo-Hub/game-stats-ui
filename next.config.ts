import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== "production",
  // Note: Custom runtimeCaching and fallbacks removed for pnpm compatibility
  // The default caching strategies from next-pwa work well for most cases
});

const nextConfig: NextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Produce a standalone build so the Dockerfile can copy the standalone output
  // This instructs Next to emit a `standalone` folder under `.next` containing
  // a self-contained server build which is suitable for container images.
  output: 'standalone',

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Empty turbopack config to acknowledge webpack usage from next-pwa
  // next-pwa doesn't support Turbopack yet, so we use webpack for builds
  turbopack: {},
};

export default withPWA(nextConfig);
