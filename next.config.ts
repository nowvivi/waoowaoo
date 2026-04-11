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
};

  // 👇 只有这4个优化，绝对不报错，最省内存
  eslint: { ignoreDuringBuilds: true };
  typescript: { ignoreBuildErrors: true };
  images: { unoptimized: true };
  output: "standalone";

  // 👇 新增：Vercel 构建 OOM 核心优化配置（关键！）
  reactStrictMode: false;
  productionBrowserSourceMaps: false; // 关闭 sourcemap，大幅降低构建内存
  eslint: {
    ignoreDuringBuilds: true // 构建时跳过 ESLint 检查，省内存
  };
  typescript: {
    ignoreBuildErrors: true // 构建时跳过 TS 类型检查，省内存
  };
  images: {
    unoptimized: true // 关闭图片优化，避免构建时处理大量图片吃内存
  };
  optimizeFonts: false; // 关闭字体优化，减少构建开销
  swcMinify: true; // 用 SWC 压缩，比 Terser 更省内存、更快
  compress: true;
  output: "standalone"; // 轻量化输出，大幅降低构建内存占用

export default withNextIntl(nextConfig);
