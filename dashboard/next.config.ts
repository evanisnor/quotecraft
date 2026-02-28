import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Restrict page file extensions so that Feature-Sliced Design barrel files
  // (index.ts, index.tsx) in src/pages/ are not mistakenly treated as legacy
  // Pages Router routes. App Router page.tsx files are still matched because
  // their filename contains the 'page.tsx' extension.
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
};

export default nextConfig;
