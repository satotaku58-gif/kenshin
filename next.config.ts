import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.pages.dev", "*.cloudflare.com"],
    },
  },
};

export default nextConfig;
