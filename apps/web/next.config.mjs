/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/player/:path*",
        destination: "/app/player/:path*",
        permanent: true
      },
      {
        source: "/scout/:path*",
        destination: "/app/scout/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
