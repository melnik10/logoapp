import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Фото, видео и аудио домашек отправляются через server actions
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
