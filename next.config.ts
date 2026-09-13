import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/vietqr-config',
        destination: '/admin/config',
        permanent: true,
      },
      {
        source: '/admin/vietqr-config',
        destination: '/admin/config',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
