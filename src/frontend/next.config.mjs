// src/frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.leetcode.com" },
      { protocol: "https", hostname: "leetcode.com" },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  }
};

export default nextConfig;
