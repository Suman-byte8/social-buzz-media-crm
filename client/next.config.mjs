/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  // Only apply the static-export contract to production builds. `next dev`
  // enforces `output: 'export'` + `generateStaticParams()` very strictly:
  // ANY dynamic-route id not in the pre-generated list throws a raw, hard
  // "missing param ... required with output: export config" error instead of
  // ever reaching the app's own not-found page — this check lives inside
  // Next's dev server itself and has no opt-out while `output` is 'export'.
  // Leaving `output` unset in dev restores normal dynamic rendering, where
  // `dynamicParams = false` correctly falls through to notFound() for unknown
  // ids. `next build` still produces the deployable static `out/` site
  // exactly as before, since that always runs with NODE_ENV=production.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
};

export default nextConfig;
