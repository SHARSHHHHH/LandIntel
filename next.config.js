/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3", "@xenova/transformers", "onnxruntime-node"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@xenova/transformers": "commonjs @xenova/transformers",
        "onnxruntime-node": "commonjs onnxruntime-node",
      });
    }
    return config;
  },
};

module.exports = nextConfig;
