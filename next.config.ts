import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  transpilePackages: ["@vladmandic/face-api"],
  async redirects() {
    return [
      {
        source: "/inventory/maintenance",
        destination: "/maintenance",
        permanent: false,
      },
      {
        source: "/inventory/maintenance/:path*",
        destination: "/maintenance/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
