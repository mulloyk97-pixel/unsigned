import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile in the home directory doesn't
  // confuse Turbopack's root inference.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
