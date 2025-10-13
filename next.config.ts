import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude canvas and other server-side modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        stream: false,
        util: false,
        encoding: false,
      };

      // Prevent canvas from being bundled on client side
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    // Always ignore canvas module
    config.externals = [...(config.externals || [])];
    if (!isServer) {
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas');
      }
    }

    // Handle PDF.js worker files
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },
  // Suppress canvas warning
  transpilePackages: ['pdfjs-dist'],
};

export default nextConfig;
