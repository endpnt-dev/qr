/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'sharp',
      '@qr-platform/qr-code.js',
      '@resvg/resvg-js',
      '@undecaf/zbar-wasm'
    ]
  },
  images: {
    domains: []
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-side dependencies on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sharp': false,
        '@qr-platform/qr-code.js': false,
        fs: false,
        path: false,
      }
    } else {
      // Server-side webpack config for handling native modules
      config.externals = config.externals || []
      config.externals.push({
        '@resvg/resvg-js-linux-x64-gnu': '@resvg/resvg-js-linux-x64-gnu',
        '@undecaf/zbar-wasm': '@undecaf/zbar-wasm'
      })
    }
    return config
  }
}

module.exports = nextConfig