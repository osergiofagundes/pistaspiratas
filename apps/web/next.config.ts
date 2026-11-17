import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@arena/platform', '@arena/codenomes', '@arena/words'],
  reactStrictMode: true,
  devIndicators: false,
}

export default nextConfig
