import { NextRequest, NextResponse } from "next/server";
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
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

// Cache the agent to avoid re-initializing on every request
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agentExecutor: any | null = null;

async function getAgent() {
  if (agentExecutor) return agentExecutor;

  // Validate environment variables
  const requiredEnvVars = [
    "CDP_API_KEY_ID",
    "CDP_API_KEY_SECRET",
    "CDP_WALLET_SECRET",
    "OPENAI_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}. ` +
        `Please copy .env.example to .env.local and fill in your API keys.`
    );
  }

  // Initialize the CDP wallet provider
  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  });

  // Initialize AgentKit with action providers
  const agentKit = await AgentKit.from({
    walletProvider,
    actionProviders: [
      wethActionProvider(),
      walletActionProvider(),
      erc20ActionProvider(),
      erc721ActionProvider(),
      cdpApiActionProvider(),
      pythActionProvider(),
      basenameActionProvider(),
    ],
  });

  // Get LangChain tools from AgentKit
  const tools = await getLangChainTools(agentKit);

  // Initialize the LLM
  const llm = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // System prompt that defines the agent's personality and capabilities
  const systemPrompt = `You are a helpful AI agent specialized in the Base blockchain ecosystem.
You have access to a real crypto wallet on ${process.env.NETWORK_ID || "base-sepolia"} and can perform onchain actions.

Your capabilities include:
- Checking wallet address and ETH/token balances
- Transferring ETH and ERC-20 tokens
- Wrapping and unwrapping ETH to/from WETH
- Fetching real-time prices from Pyth oracle
- Registering Basenames (.base.eth domains)
- Requesting testnet funds from the CDP faucet
- Interacting with ERC-721 NFT contracts

When asked to perform onchain actions:
1. Always confirm what you're about to do before executing
2. Provide transaction hashes when actions complete
3. Use testnet (base-sepolia) by default for safety
4. Keep responses concise and informative

If you don't have the required API keys, explain what's needed clearly.
Format amounts in a human-readable way (e.g., 0.001 ETH, not 1000000000000000 wei).`;

  // Create the React agent
  agentExecutor = createReactAgent({
    llm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools as any,
    messageModifier: systemPrompt,
  });

  return agentExecutor;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const agent = await getAgent();

    // Build message history
    const messages: BaseMessage[] = history.flatMap(
      (msg: { role: string; content: string }) => {
        if (msg.role === "user") return [new HumanMessage(msg.content)];
        if (msg.role === "assistant") return [new AIMessage(msg.content)];
        return [];
      }
    );

    // Add the current user message
    messages.push(new HumanMessage(message));

    // Invoke the agent
    const result = await agent.invoke(
      { messages },
      { configurable: { thread_id: "basebuilder-session" } }
    );

    // Extract the last AI message
    const lastMessage = result.messages[result.messages.length - 1];
    const output =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return NextResponse.json({ output });
  } catch (error: unknown) {
    console.error("[Agent API Error]", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    // Provide helpful error messages for common issues
    if (errorMessage.includes("Missing required environment variables")) {
      return NextResponse.json(
        {
          error: errorMessage,
          hint: "Get your free CDP API keys at https://portal.cdp.coinbase.com and your OpenAI key at https://platform.openai.com",
        },
        { status: 503 }
      );
    }

    if (errorMessage.includes("OPENAI_API_KEY") || errorMessage.includes("Incorrect API key")) {
      return NextResponse.json(
        { error: "Invalid or missing OpenAI API key. Please check your OPENAI_API_KEY in .env.local" },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
