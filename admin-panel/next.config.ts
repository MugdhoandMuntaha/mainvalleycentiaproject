import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
