/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // Disable all static generation completely
  experimental: {
    ppr: false,
  },
  // Key: Remove static export generation
  async rewrites() {
    return []
  },
}

module.exports = nextConfig
