/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.leetcode.com" },
    ],
  },
};

export default nextConfig;
