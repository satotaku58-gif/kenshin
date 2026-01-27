import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/patient_basic',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
