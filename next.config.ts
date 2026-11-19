import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  allowedDevOrigins: ['172.24.193.162'],
};
export default nextConfig;
