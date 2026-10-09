import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Project rules are maintained in AGENTS.md, without generated appendices.
  agentRules: false,
  images: {
    localPatterns: [{ pathname: "/vehicle-images/**", search: "" }],
    remotePatterns: [],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
