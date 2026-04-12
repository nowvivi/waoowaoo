import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://192.168.31.218:3000',
    'http://192.168.31.*:3000',
  ],
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  output: "standalone",
  swcMinify: true,
  cleanDistDir: true,
  poweredByHeader: false,

  experimental: {
    serverComponentsExternalPackages: [
      "sharp",
      "prisma",
      "canvas",
      "ffmpeg"
    ],
    // 显式排除缓存目录，彻底拦截打包
    outputFileTracingExcludes: {
      '*': [
        '.next/cache/**',
        'node_modules/.cache/**',
        '.git/**',
        '*.log'
      ]
    }
  },

  // 仅在服务端打包时排除依赖，避免客户端异常
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), "sharp", "prisma", "canvas"];
    }
    return config;
  },
};

export default withNextIntl(nextConfig);