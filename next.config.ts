import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  transpilePackages: ["@vladmandic/face-api"],
};

export default nextConfig;
