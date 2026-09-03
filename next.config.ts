import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The demo ships pre-sized local imagery and user uploads are resized on
    // write; skipping the optimizer keeps the app portable to any host.
    unoptimized: true,
  },
};

export default nextConfig;
