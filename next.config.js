/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Disable static optimization to prevent build-time errors
  experimental: {
    isrMemoryCacheSize: 0,
  },
}

module.exports = nextConfig
