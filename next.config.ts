import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.nocookie.net" },
      { protocol: "https", hostname: "**.wikia.nocookie.net" },
      { protocol: "https", hostname: "**.fandom.com" }
    ]
  }
};

export default nextConfig;
