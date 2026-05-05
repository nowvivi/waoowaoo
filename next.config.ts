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

  // 👇 只改了这里！！！
  output: "export",

  swcMinify: true,
  cleanDistDir: true,
  poweredByHeader: false,

  // 👇 删掉所有服务端相关实验配置
  webpack: (config, { isServer }) => {
    return config;
  },
};

export default withNextIntl(nextConfig);