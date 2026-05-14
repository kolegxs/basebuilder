import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { routeTask, getSubAgent } from "@/lib/agents";
import {
  AGENT_DEFINITIONS,
  type AgentId,
  type AgentRunStep,
} from "@/lib/agent-types";

// ---------------------------------------------------------------------------
// POST /api/multi-agent
// Body:  { message: string }
// Returns: { steps: AgentRunStep[], output: string, agentUsed: AgentId }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // Validate env vars
    const required = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET", "OPENAI_API_KEY"];
    const missing = required.filter((v) => !process.env[v]);
    if (missing.length) {
      return NextResponse.json(
        {
          error: `Missing environment variables: ${missing.join(", ")}`,
          hint: "Copy .env.example → .env.local and fill in your keys",
        },
        { status: 503 }
      );
    }

    const steps: AgentRunStep[] = [];
    const now = () => new Date();

    // ── Step 1: Orchestrator routes the task ──────────────────────────────
    steps.push({
      agent: "orchestrator",
      type: "thinking",
      content: `Analysing task: "${message}"`,
      timestamp: now(),
    });

    const routing = await routeTask(message);

    steps.push({
      agent: "orchestrator",
      type: "route",
      content: `Routing to **${AGENT_DEFINITIONS[routing.route].emoji} ${AGENT_DEFINITIONS[routing.route].name}** — ${routing.reason}`,
      timestamp: now(),
    });

    // ── Step 2: Sub-agent executes the task ───────────────────────────────
    const subAgentId = routing.route as AgentId;
    const subAgentDef = AGENT_DEFINITIONS[subAgentId];

    steps.push({
      agent: subAgentId,
      type: "thinking",
      content: `Received task: "${routing.task}"`,
      timestamp: now(),
    });

    const subAgent = await getSubAgent(subAgentId);

    const result = await subAgent.invoke(
      { messages: [new HumanMessage(routing.task)] },
      { configurable: { thread_id: `multi-${subAgentId}-${Date.now()}` } }
    );

    // Walk through intermediate tool calls for the run log
    const allMessages = result.messages as { _getType?: () => string; content: unknown; name?: string }[];
    for (const msg of allMessages) {
      const type = msg._getType?.() ?? "";
      if (type === "tool") {
        steps.push({
          agent: subAgentId,
          type: "action",
          content: `Used tool \`${msg.name ?? "unknown"}\``,
          timestamp: now(),
        });
      }
    }

    // Final answer
    const lastMsg = allMessages[allMessages.length - 1];
    const output =
      typeof lastMsg.content === "string"
        ? lastMsg.content
        : JSON.stringify(lastMsg.content);

    steps.push({
      agent: subAgentId,
      type: "result",
      content: output,
      timestamp: now(),
    });

    return NextResponse.json({
      steps,
      output,
      agentUsed: subAgentId,
      agentName: subAgentDef.name,
      routing,
    });
  } catch (err: unknown) {
    console.error("[Multi-Agent API]", err);
    const msg = err instanceof Error ? err.message : "Unexpected error";

    if (msg.includes("Missing") && msg.includes("environment")) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
