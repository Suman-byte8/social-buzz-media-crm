/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: '.',
  },
};

export default nextConfig;
