const path = require('path');
const { config } = require('dotenv');

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Proxy to Backend
      },
    ];
  },
  
  // Configure allowed image sources for next/image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vbtvfxvthhsjanfeojjt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Optional: Configure image sizes for better performance
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;