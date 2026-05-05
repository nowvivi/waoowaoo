import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  output: "export", // 纯静态，无 Serverless
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  swcMinify: true,
  cleanDistDir: true,
  poweredByHeader: false,
  // 删掉所有 experimental.serverComponentsExternalPackages
  // 删掉 webpack.externals
};

export default withNextIntl(nextConfig);