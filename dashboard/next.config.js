/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3001'] },
  },
  images: {
    remotePatterns: [{ hostname: 'avatars.githubusercontent.com' }],
  },
};

module.exports = nextConfig;
