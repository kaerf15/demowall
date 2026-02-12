import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler: true,
  // basePath: "/demowall",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sdafafsasgvagdfs.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;