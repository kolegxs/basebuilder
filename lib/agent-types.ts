// ─────────────────────────────────────────────────────────────────────────────
// Client-safe agent types & metadata — NO server imports here
// This file is safe to import from Client Components.
// ─────────────────────────────────────────────────────────────────────────────

export type AgentId = "orchestrator" | "defi" | "price" | "wallet";

export type AgentDefinition = {
  id: AgentId;
  name: string;
  emoji: string;
  color: string;
  description: string;
  capabilities: string[];
};

export type AgentRunStep = {
  agent: AgentId;
  type: "thinking" | "action" | "result" | "error" | "route";
  content: string;
  timestamp: Date | string;
};

export type OrchestratorRoute = {
  route: "wallet" | "defi" | "price";
  reason: string;
  task: string;
};

export type MultiAgentResponse = {
  steps: AgentRunStep[];
  output: string;
  agentUsed: AgentId;
  agentName: string;
  routing: OrchestratorRoute;
};

// ─── Static metadata (no server deps) ────────────────────────────────────────

export const AGENT_DEFINITIONS: Record<AgentId, AgentDefinition> = {
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator",
    emoji: "🧠",
    color: "#0052ff",
    description: "Analyses your request and routes it to the best specialist agent.",
    capabilities: ["Task routing", "Multi-step planning", "Result synthesis"],
  },
  wallet: {
    id: "wallet",
    name: "Wallet Agent",
    emoji: "💰",
    color: "#10b981",
    description: "Handles all wallet ops: balances, transfers, basenames, faucet, WETH.",
    capabilities: [
      "ETH & token balances",
      "Native transfers",
      "WETH wrap / unwrap",
      "Register Basenames",
      "Request faucet funds",
      "ERC-20 & ERC-721",
    ],
  },
  defi: {
    id: "defi",
    name: "DeFi Agent",
    emoji: "🏦",
    color: "#8b5cf6",
    description: "Executes DeFi operations: Morpho vaults, Compound lending & borrowing.",
    capabilities: [
      "Morpho vault deposit",
      "Morpho vault withdraw",
      "Compound supply",
      "Compound borrow",
      "Compound repay",
      "Portfolio overview",
    ],
  },
  price: {
    id: "price",
    name: "Price Agent",
    emoji: "📊",
    color: "#f59e0b",
    description: "Fetches live prices via Pyth oracle and DeFi data from DefiLlama.",
    capabilities: [
      "Live token prices (Pyth)",
      "Price feed IDs",
      "Protocol TVL (DefiLlama)",
      "Token price lookups",
    ],
  },
};
