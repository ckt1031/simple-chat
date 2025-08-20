import getBuildMetadata from "@/build-meta";
import type { NextConfig } from "next";

const experimentalSettings: NextConfig["experimental"] = {};

if (process.env.NODE_ENV === "production") {
  experimentalSettings.sri = {
    algorithm: "sha384",
  };
  experimentalSettings.reactCompiler = true;
}

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  experimental: experimentalSettings,
  env: {
    ...getBuildMetadata(),
  },
};

export default nextConfig;
