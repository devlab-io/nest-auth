/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@devlab-io/nest-auth-client',
    '@devlab-io/nest-auth-types',
  ],
};

module.exports = nextConfig;
