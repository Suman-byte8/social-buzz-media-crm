/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
