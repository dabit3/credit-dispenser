import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    IS_DEVIN: process.env.IS_DEVIN || "",
  },
};

export default nextConfig;
