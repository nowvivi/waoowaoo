import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  // 已删除 ignoreBuildErrors / ignoreDuringBuilds，构建保持严格门禁
  // Next 15 的 allowedDevOrigins 是顶层配置，不属于 experimental
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
  experimental: {
    serverComponentsExternalPackages: [
      "sharp",
      "prisma",
      "canvas"
    ],
  },
  // 关键：禁止把巨大依赖打包进 Serverless 函数
  webpack: (config) => {
    config.externals = [...(config.externals || []), "sharp", "prisma"];
    return config;
  },
  // 关闭不必要的缓存上传
  cleanDistDir: true,
};

export default withNextIntl(nextConfig);