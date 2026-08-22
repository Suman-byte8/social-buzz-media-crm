/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  output: 'export',
};

export default nextConfig;
