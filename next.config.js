/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable server-side features for static export
  distDir: 'out',
}

module.exports = nextConfig 