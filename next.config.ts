import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*.pages.dev", "*.cloudflare.com"],
    },
  },
  output: "standalone",
};

export default nextConfig;
