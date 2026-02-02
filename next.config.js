/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'http',
        hostname: 'www.aladin.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
      },
    ],
  },
};

module.exports = nextConfig;