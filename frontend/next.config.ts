import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'https://mysuru-travels-club-09.onrender.com/api/v1',
    NEXT_PUBLIC_SOCKET_URL: 'https://mysuru-travels-club-09.onrender.com',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'sl.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.corenexis.com',
      },
      {
        protocol: 'https',
        hostname: 'mysuru-travels-club-09.onrender.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      },
    ],
  },
};

export default nextConfig;