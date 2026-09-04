import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploads are normalised + resized to JPEG on write (lib/images.ts), so the
    // built-in optimizer would only add cost. Blob/local URLs render as-is.
    unoptimized: true,
  },
  // native / wasm modules — keep them out of the bundler
  serverExternalPackages: ["sharp", "heic-convert", "heic-decode", "libheif-js"],
};

export default nextConfig;
