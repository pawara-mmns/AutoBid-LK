import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Project rules are maintained in AGENTS.md, without generated appendices.
  agentRules: false,
};

export default nextConfig;
