/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@secure-file-drop/crypto'],
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
