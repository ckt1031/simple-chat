import getBuildMetadata from "@/build-meta";
import type { NextConfig } from "next";

const experimentalSettings: NextConfig["experimental"] = {};

if (process.env.NODE_ENV === "production") {
  experimentalSettings.reactCompiler = true;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: experimentalSettings,
  env: {
    ...getBuildMetadata(),
  },
};

export default nextConfig;
