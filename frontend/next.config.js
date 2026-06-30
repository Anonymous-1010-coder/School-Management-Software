/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sms/shared'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
