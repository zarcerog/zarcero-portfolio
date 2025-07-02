/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/zarcero-portfolio',
  assetPrefix: '/zarcero-portfolio/',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
