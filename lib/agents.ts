import "server-only";
import {
  AgentKit,
  CdpEvmWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  erc721ActionProvider,
  cdpApiActionProvider,
  pythActionProvider,
  basenameActionProvider,
  morphoActionProvider,
  compoundActionProvider,
  defillamaActionProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { AgentId } from "./agent-types";
export { AGENT_DEFINITIONS } from "./agent-types";

// ─── Server-only agent system prompts ────────────────────────────────────────

const SYSTEM_PROMPTS: Record<AgentId, string> = {
  orchestrator: `You are an orchestrator AI that routes tasks to the right specialist agent.

Available agents:
- WALLET AGENT: wallet address, ETH/token balances, transfers, faucet, WETH wrap/unwrap, basenames
- DEFI AGENT: DeFi protocols, Morpho vault deposits/withdrawals, Compound supply/borrow/repay
- PRICE AGENT: live token prices (Pyth oracle), DefiLlama protocol TVL, token price lookups

Analyse the user's request and respond in this exact JSON format:
{
  "route": "<wallet|defi|price>",
  "reason": "<one sentence why>",
  "task": "<cleaned up task description to pass to the sub-agent>"
}

Only respond with valid JSON — no markdown fences, no extra text.`,

  wallet: `You are a wallet specialist AI agent on the Base blockchain ecosystem.
You have access to a real onchain wallet on ${process.env.NETWORK_ID || "base-sepolia"}.

Your focus areas:
- Check wallet address and ETH/token balances
- Transfer ETH and ERC-20 tokens
- Wrap and unwrap ETH ↔ WETH
- Register Basenames (.base.eth domains)
- Request testnet faucet funds
- Interact with ERC-721 NFTs

Rules:
1. Always report the transaction hash when a tx completes
2. Format amounts human-readably (0.001 ETH, not 1000000000000000 wei)
3. Use base-sepolia by default for any transfers
4. Be concise and factual`,

  defi: `You are a DeFi specialist AI agent on the Base blockchain ecosystem.
You have access to a real onchain wallet on ${process.env.NETWORK_ID || "base-sepolia"}.

Your focus areas:
- Morpho: deposit and withdraw from yield vaults
- Compound: supply collateral, borrow base assets, repay loans, get portfolio

Rules:
1. Always confirm the operation details before executing
2. Report transaction hashes on success
3. Warn the user if they are about to use real funds on mainnet
4. Be specific about vault addresses and asset types`,

  price: `You are a price and market data specialist AI agent.
You have access to real-time price feeds via Pyth Network and DeFi data via DefiLlama.

Your focus areas:
- Fetch live token prices from Pyth oracle (ETH, BTC, SOL, etc.)
- Look up price feed IDs for any asset
- Find DeFi protocol TVL and metadata via DefiLlama
- Get current token prices by contract address

Rules:
1. Always state the data source (Pyth or DefiLlama)
2. Include the timestamp / last update when available
3. Format prices clearly with $ prefix and 2-6 decimal places
4. If a price feed isn't available, say so clearly`,
};

// ─── Shared wallet provider (lazy singleton) ─────────────────────────────────

let _walletProvider: CdpEvmWalletProvider | null = null;

async function getWalletProvider(): Promise<CdpEvmWalletProvider> {
  if (_walletProvider) return _walletProvider;
  _walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  });
  return _walletProvider;
}

function makeLLM(temperature = 0) {
  return new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}

// ─── Agent factories ──────────────────────────────────────────────────────────

// Cache per agent ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _cache: Partial<Record<AgentId, any>> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSubAgent(id: AgentId): Promise<any> {
  if (_cache[id]) return _cache[id];

  const systemPrompt = SYSTEM_PROMPTS[id];
  const wp = await getWalletProvider();

  let actionProviders;

  switch (id) {
    case "wallet":
      actionProviders = [
        wethActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        erc721ActionProvider(),
        cdpApiActionProvider(),
        basenameActionProvider(),
      ];
      break;

    case "defi":
      actionProviders = [
        walletActionProvider(),
        erc20ActionProvider(),
        morphoActionProvider(),
        compoundActionProvider(),
      ];
      break;

    case "price":
      actionProviders = [
        pythActionProvider(),
        defillamaActionProvider(),
      ];
      break;

    default:
      actionProviders = [walletActionProvider()];
  }

  const agentKit = await AgentKit.from({
    walletProvider: wp,
    actionProviders,
  });

  const tools = await getLangChainTools(agentKit);
  const llm = makeLLM();

  const agent = createReactAgent({
    llm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools as any,
    messageModifier: systemPrompt,
  });

  _cache[id] = agent;
  return agent;
}

/** Pure LLM call — no tools — used by the orchestrator to decide routing */
export function getOrchestratorLLM() {
  return makeLLM(0);
}

// ─── Routing helper ───────────────────────────────────────────────────────────

export type OrchestratorRoute = {
  route: "wallet" | "defi" | "price";
  reason: string;
  task: string;
};

export async function routeTask(userMessage: string): Promise<{ route: "wallet" | "defi" | "price"; reason: string; task: string }> {
  const llm = getOrchestratorLLM();
  const systemPrompt = SYSTEM_PROMPTS.orchestrator;

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ]);

  const raw = typeof response.content === "string"
    ? response.content.trim()
    : JSON.stringify(response.content);

  // Strip possible markdown fences
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    return JSON.parse(cleaned) as OrchestratorRoute;
  } catch {
    // Fallback: send everything to wallet agent
    return { route: "wallet", reason: "Default fallback", task: userMessage };
  }
}
