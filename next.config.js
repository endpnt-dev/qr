/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    'sharp'
  ],
  images: {
    domains: []
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side dependencies on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sharp': false,
        fs: false,
        path: false,
      }
    }
    return config
  }
}

module.exports = nextConfig