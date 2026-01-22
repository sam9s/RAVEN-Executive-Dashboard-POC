/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable static page generation for all pages
    isrMemoryCacheSize: 0,
  },
  // Skip static optimization for dynamic pages
  output: 'standalone',
}

module.exports = nextConfig
