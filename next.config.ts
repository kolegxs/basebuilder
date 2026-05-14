import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for AgentKit and its dependencies (Node.js-only modules)
  serverExternalPackages: [
    "@coinbase/agentkit",
    "@coinbase/agentkit-langchain",
    "@langchain/langgraph",
    "@langchain/openai",
    "langchain",
  ],
  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {},
};

export default nextConfig;
