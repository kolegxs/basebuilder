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
import {
  getMessages,
  appendMessage,
  createConversation,
  updateConversationTitle,
  generateTitle,
} from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Agent singleton — initialized once, reused across requests
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agentExecutor: any | null = null;

/** Returns true when all required env vars are present */
function hasSupabase() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

async function getAgent() {
  if (agentExecutor) return agentExecutor;

  const requiredVars = [
    "CDP_API_KEY_ID",
    "CDP_API_KEY_SECRET",
    "CDP_WALLET_SECRET",
    "OPENAI_API_KEY",
  ];
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Please copy .env.example to .env.local and fill in your API keys."
    );
  }

  const walletProvider = await CdpEvmWalletProvider.configureWithWallet({
    apiKeyId: process.env.CDP_API_KEY_ID!,
    apiKeySecret: process.env.CDP_API_KEY_SECRET!,
    walletSecret: process.env.CDP_WALLET_SECRET!,
    networkId: process.env.NETWORK_ID || "base-sepolia",
  });

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

  const tools = await getLangChainTools(agentKit);

  const llm = new ChatOpenAI({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

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

Format amounts in a human-readable way (e.g., 0.001 ETH, not 1000000000000000 wei).`;

  agentExecutor = createReactAgent({
    llm,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools as any,
    messageModifier: systemPrompt,
  });

  return agentExecutor;
}

// ---------------------------------------------------------------------------
// POST /api/agent
// Body: { message: string, conversationId?: string }
// Returns: { output: string, conversationId: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversationId: incomingId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const usePersistence = hasSupabase();
    let conversationId: string = incomingId ?? "";
    let historyMessages: BaseMessage[] = [];

    // ── Load history from DB (if Supabase is configured) ──────────────────
    if (usePersistence) {
      // Create a new conversation when none is provided
      if (!conversationId) {
        const convo = await createConversation("New Conversation");
        conversationId = convo.id;
      }

      // Fetch persisted messages and rebuild LangChain history
      const dbMessages = await getMessages(conversationId);
      historyMessages = dbMessages.map((m) =>
        m.role === "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      );
    } else {
      // Fallback: use history array sent from the client
      const clientHistory: { role: string; content: string }[] =
        body.history ?? [];
      historyMessages = clientHistory.reduce<BaseMessage[]>((acc, m) => {
        if (m.role === "user") acc.push(new HumanMessage(m.content));
        else if (m.role === "assistant") acc.push(new AIMessage(m.content));
        return acc;
      }, []);
    }

    // ── Persist the incoming user message ─────────────────────────────────
    if (usePersistence) {
      await appendMessage(conversationId, "user", message);
    }

    // ── Run the agent ──────────────────────────────────────────────────────
    const agent = await getAgent();
    const messages: BaseMessage[] = [
      ...historyMessages,
      new HumanMessage(message),
    ];

    const result = await agent.invoke(
      { messages },
      { configurable: { thread_id: conversationId || "basebuilder-session" } }
    );

    const lastMsg = result.messages[result.messages.length - 1];
    const output =
      typeof lastMsg.content === "string"
        ? lastMsg.content
        : JSON.stringify(lastMsg.content);

    // ── Persist the assistant reply ────────────────────────────────────────
    if (usePersistence) {
      await appendMessage(conversationId, "assistant", output);

      // Auto-title the conversation from the first user message
      const isFirstMessage = historyMessages.length === 0;
      if (isFirstMessage) {
        await updateConversationTitle(
          conversationId,
          generateTitle(message)
        );
      }
    }

    return NextResponse.json({ output, conversationId });
  } catch (err: unknown) {
    console.error("[Agent API Error]", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";

    if (msg.includes("Missing required environment variables")) {
      return NextResponse.json(
        {
          error: msg,
          hint: "Get your free CDP API keys at https://portal.cdp.coinbase.com and your OpenAI key at https://platform.openai.com",
        },
        { status: 503 }
      );
    }
    if (msg.includes("OPENAI_API_KEY") || msg.includes("Incorrect API key")) {
      return NextResponse.json(
        { error: "Invalid or missing OpenAI API key. Check OPENAI_API_KEY in .env.local" },
        { status: 401 }
      );
    }
    if (msg.includes("Missing Supabase")) {
      return NextResponse.json(
        { error: msg, hint: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
