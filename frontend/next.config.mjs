// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   output: 'standalone',
// };

// export default nextConfig;



/** @type {import('next').NextConfig} */

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL);

const nextConfig = {
  compress: false,
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isVercel ? {} : { output: 'standalone' }),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },
  async redirects() {
    return [
      {
        source: '/shop',
        destination: '/products',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
