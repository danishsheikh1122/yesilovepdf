import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Increase from default 1mb to 50mb for large files
    },
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js properly for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        stream: false,
        util: false,
        encoding: false,
        path: false,
        url: false,
        'pdfjs-dist/build/pdf.worker.js': false,
      };

      // More aggressive canvas exclusion - prevent any canvas imports
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
        'canvas/lib/bindings': false,
        '../build/Release/canvas.node': false,
      };

      // Use null-loader to ignore canvas completely
      config.module.rules.push({
        test: /canvas/,
        use: 'null-loader',
      });

      // Ignore specific canvas.node files
      config.module.rules.push({
        test: /canvas\.node$/,
        use: 'null-loader',
      });

      // More aggressive canvas exclusion
      config.module.rules.push({
        test: /node_modules.*canvas.*\.node$/,
        use: 'null-loader',
      });

      // Use webpack IgnorePlugin for Node.js specific modules
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
      
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /canvas\.node$/,
        })
      );

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
          contextRegExp: /pdfjs-dist/,
        })
      );

      // Ignore Node.js specific modules in pdfjs-dist
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(fs|path|url)$/,
          contextRegExp: /pdfjs-dist/,
        })
      );

      // Add canvas as external to prevent bundling
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas');
        config.externals.push({ canvas: 'canvas' });
        config.externals.push({
          canvas: 'commonjs canvas',
          'canvas/lib/bindings': 'commonjs canvas/lib/bindings',
        });
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
