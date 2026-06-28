import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/npb-analytics",
  images: { unoptimized: true },
};

export default nextConfig;
