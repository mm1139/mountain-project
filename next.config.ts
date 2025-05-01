import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // (Optional) Export as a standalone site
  output: 'standalone', // 必要に応じて変更可能
  serverExternalPackages: ['@huggingface/transformers', '@xenova/transformers'],
};

export default nextConfig;
