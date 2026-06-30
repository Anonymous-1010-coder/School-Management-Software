/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sms/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  output: 'standalone',
};

module.exports = nextConfig;
