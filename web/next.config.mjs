/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  transpilePackages: ["@safe-global/protocol-kit", "@safe-global/relay-kit"]
};

export default nextConfig;
