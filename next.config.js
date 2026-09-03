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
  // Load GLSL shaders as raw source strings. jest.glsl-transformer.js mirrors
  // this for the test environment.
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    })
    return config
  },
}

module.exports = nextConfig 