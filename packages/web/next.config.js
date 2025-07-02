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
      // Supabase storage
      {
        protocol: 'https',
        hostname: 'vbtvfxvthhsjanfeojjt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Yelp CDN domains
      {
        protocol: 'https',
        hostname: 's3-media0.fl.yelpcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-media1.fl.yelpcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-media2.fl.yelpcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-media3.fl.yelpcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3-media4.fl.yelpcdn.com',
        pathname: '/**',
      },
      // TripAdvisor CDN
      {
        protocol: 'https',
        hostname: 'dynamic-media-cdn.tripadvisor.com',
        pathname: '/**',
      },
      // WordPress domains
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'berkeleyside.wordpress.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'berzerkeley.wordpress.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dailycoffeenews.com',
        pathname: '/**',
      },
      // Other image hosts
      {
        protocol: 'https',
        hostname: 'bloximages.chicago2.vip.townnews.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.rbl.ms',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.visitberkeley.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.lib.berkeley.edu',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.noodline.com',
        pathname: '/**',
      },
    ],
    // Optional: Configure image sizes for better performance
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;