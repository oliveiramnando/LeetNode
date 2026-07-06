// src/frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.leetcode.com" },
      { protocol: "https", hostname: "leetcode.com" },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://leetnode-b03i.onrender.com/:path*",
      },
    ];
  },

  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;