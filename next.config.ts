import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

export default function nextConfig(phase: string): NextConfig {
  const config: NextConfig = {
    poweredByHeader: false,
    experimental: { serverActions: { bodySizeLimit: '12mb' } },
  };

  if (phase === PHASE_DEVELOPMENT_SERVER) {
    const privateIPv4 = /^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.)/;
    config.allowedDevOrigins = Object.values(networkInterfaces()).flatMap(interfaces =>
      (interfaces ?? [])
        .filter(({ family, internal, address }) => family === 'IPv4' && !internal && privateIPv4.test(address))
        .map(({ address }) => address)
    );
  }

  return config;
}
