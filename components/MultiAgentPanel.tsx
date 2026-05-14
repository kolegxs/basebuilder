"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Zap,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import { AGENT_DEFINITIONS, type AgentId, type AgentRunStep } from "@/lib/agent-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type RunResult = {
  steps: AgentRunStep[];
  output: string;
  agentUsed: AgentId;
  agentName: string;
  routing: { route: string; reason: string; task: string };
};

type Run = {
  id: string;
  message: string;
  result: RunResult | null;
  error: string | null;
  loading: boolean;
  startedAt: Date;
};

// ─── Starter prompts ──────────────────────────────────────────────────────────

const STARTERS: { label: string; prompt: string; agent: AgentId }[] = [
  { label: "💰 Check balance", prompt: "What is my wallet address and ETH balance?", agent: "wallet" },
  { label: "🚰 Get test ETH", prompt: "Request testnet ETH from the faucet", agent: "wallet" },
  { label: "📊 ETH price", prompt: "What is the current price of ETH?", agent: "price" },
  { label: "🏦 Morpho TVL", prompt: "What is the TVL of the Morpho protocol?", agent: "price" },
  { label: "🔗 Register Basename", prompt: "Register a basename for my wallet on base-sepolia", agent: "wallet" },
  { label: "💱 Wrap ETH", prompt: "Wrap 0.001 ETH to WETH on base-sepolia", agent: "wallet" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiAgentPanel() {
  const [input, setInput] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [runs]);

  const submit = async (message: string) => {
    if (!message.trim()) return;

    const run: Run = {
      id: Date.now().toString(),
      message: message.trim(),
      result: null,
      error: null,
      loading: true,
      startedAt: new Date(),
    };
    setRuns((prev) => [...prev, run]);
    setInput("");

    try {
      const res = await fetch("/api/multi-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Agent failed");

      setRuns((prev) =>
        prev.map((r) => (r.id === run.id ? { ...r, loading: false, result: data } : r))
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setRuns((prev) =>
        prev.map((r) => (r.id === run.id ? { ...r, loading: false, error: msg } : r))
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const clearRuns = () => setRuns([]);
  const isRunning = runs.some((r) => r.loading);

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-[#1e293b] bg-[#0d1117] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0052ff]" />
              Multi-Agent System
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Orchestrator routes your task to the best specialist agent automatically
            </p>
          </div>
          {runs.length > 0 && (
            <button
              onClick={clearRuns}
              className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94a3b8] border border-[#1e293b] rounded-lg px-3 py-1.5 hover:border-[#334155] transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-4 gap-2">
          {(Object.values(AGENT_DEFINITIONS) as typeof AGENT_DEFINITIONS[AgentId][]).map((def) => (
            <AgentCard key={def.id} def={def} />
          ))}
        </div>
      </div>

      {/* ── Run log ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Empty state */}
        {runs.length === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1e293b] flex items-center justify-center mb-3">
                <Zap className="w-7 h-7 text-[#334155]" />
              </div>
              <p className="text-sm font-medium text-[#475569]">Send a task to get started</p>
              <p className="text-xs text-[#334155] mt-1 max-w-sm">
                The Orchestrator will automatically route it to the right specialist agent
              </p>
            </div>

            {/* Starter prompts */}
            <div>
              <p className="text-[10px] text-[#475569] mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Try these tasks
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STARTERS.map((s) => {
                  const def = AGENT_DEFINITIONS[s.agent];
                  return (
                    <button
                      key={s.prompt}
                      onClick={() => submit(s.prompt)}
                      className="text-left p-3 rounded-xl border border-[#1e293b] hover:border-[#334155] hover:bg-[#111827] transition-all group"
                    >
                      <p className="text-xs font-medium text-[#94a3b8] group-hover:text-white transition-colors">
                        {s.label}
                      </p>
                      <p className="text-[10px] text-[#475569] mt-0.5 truncate">{s.prompt}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ backgroundColor: `${def.color}15`, color: def.color, border: `1px solid ${def.color}25` }}>
                          → {def.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Runs */}
        {runs.map((run) => (
          <RunCard key={run.id} run={run} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="px-6 pb-5 shrink-0">
        <div className="flex gap-2 items-end bg-[#111827] border border-[#1e293b] rounded-2xl p-2 focus-within:border-[#0052ff]/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Give the multi-agent system a task…"
            rows={1}
            disabled={isRunning}
            className="flex-1 bg-transparent resize-none text-sm text-[#e2e8f0] placeholder:text-[#334155] focus:outline-none px-2 py-1.5 max-h-32"
            style={{ minHeight: "36px" }}
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim() || isRunning}
            className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isRunning
                ? "bg-[#0052ff] hover:bg-[#0040cc] text-white"
                : "bg-[#1e293b] text-[#475569] cursor-not-allowed"
            )}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-[#334155] mt-1.5 text-center">
          Enter to send · task is automatically routed to the best agent
        </p>
      </div>
    </div>
  );
}

// ─── AgentCard ────────────────────────────────────────────────────────────────

function AgentCard({ def }: { def: typeof AGENT_DEFINITIONS[AgentId] }) {
  return (
    <div
      className="rounded-xl p-3 border transition-all"
      style={{
        backgroundColor: `${def.color}08`,
        borderColor: `${def.color}25`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{def.emoji}</span>
        <span className="text-xs font-semibold text-[#94a3b8]">{def.name}</span>
      </div>
      <p className="text-[10px] text-[#475569] leading-relaxed line-clamp-2">{def.description}</p>
    </div>
  );
}

// ─── RunCard ──────────────────────────────────────────────────────────────────

function RunCard({ run }: { run: Run }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden fade-in-up">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-[#0d1117] transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {run.loading ? (
            <Loader2 className="w-4 h-4 text-[#3b82f6] animate-spin mt-0.5 shrink-0" />
          ) : run.error ? (
            <AlertCircle className="w-4 h-4 text-[#ef4444] mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{run.message}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-[#475569]">
                {run.startedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              {run.result && (
                <>
                  <span className="text-[#334155]">·</span>
                  <span className="text-[10px]" style={{ color: AGENT_DEFINITIONS[run.result.agentUsed].color }}>
                    {AGENT_DEFINITIONS[run.result.agentUsed].emoji} {run.result.agentName}
                  </span>
                </>
              )}
              {run.loading && (
                <span className="text-[10px] text-[#3b82f6] animate-pulse">Running…</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight
          className={clsx(
            "w-4 h-4 text-[#334155] shrink-0 transition-transform mt-0.5",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-[#0d1117]">
          {/* Error */}
          {run.error && (
            <div className="px-4 py-3 flex items-start gap-2 bg-[#ef4444]/5">
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
              <p className="text-sm text-[#fca5a5]">{run.error}</p>
            </div>
          )}

          {/* Steps */}
          {run.result && (
            <div className="divide-y divide-[#0d1117]">
              {run.result.steps.map((step, i) => (
                <StepRow key={i} step={step} />
              ))}
            </div>
          )}

          {/* Loading skeleton */}
          {run.loading && (
            <div className="px-4 py-3 space-y-2 animate-pulse">
              <div className="h-3 bg-[#1e293b] rounded w-2/3" />
              <div className="h-3 bg-[#1e293b] rounded w-1/2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── StepRow ──────────────────────────────────────────────────────────────────

function StepRow({ step }: { step: AgentRunStep }) {
  const def = AGENT_DEFINITIONS[step.agent];

  const typeConfig = {
    thinking: { label: "Thinking", textColor: "#64748b", bg: "#64748b12" },
    route:    { label: "Routing",  textColor: "#0052ff", bg: "#0052ff10" },
    action:   { label: "Action",   textColor: "#f59e0b", bg: "#f59e0b10" },
    result:   { label: "Result",   textColor: "#10b981", bg: "#10b98110" },
    error:    { label: "Error",    textColor: "#ef4444", bg: "#ef444410" },
  }[step.type];

  const isResult = step.type === "result";

  return (
    <div
      className="px-4 py-3 flex items-start gap-3"
      style={{ backgroundColor: typeConfig.bg }}
    >
      {/* Agent badge */}
      <div
        className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5"
        style={{
          backgroundColor: `${def.color}20`,
          color: def.color,
          border: `1px solid ${def.color}30`,
        }}
      >
        {def.emoji}
      </div>

      <div className="flex-1 min-w-0">
        {/* Step type label */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: typeConfig.textColor }}
          >
            {typeConfig.label}
          </span>
          <span className="text-[9px] text-[#334155]">
            {step.timestamp instanceof Date
              ? step.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : new Date(step.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>

        {/* Content */}
        {isResult ? (
          <ResultContent content={step.content} />
        ) : (
          <p className="text-sm text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
            <InlineMd text={step.content} />
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Result formatter ─────────────────────────────────────────────────────────

function ResultContent({ content }: { content: string }) {
  return (
    <div className="text-sm text-[#e2e8f0] leading-relaxed space-y-1">
      {content.split("\n").map((line, i) => {
        const withBold = line.replace(
          /\*\*(.+?)\*\*/g,
          '<strong class="text-white font-semibold">$1</strong>'
        );
        const withCode = withBold.replace(
          /`(.+?)`/g,
          '<code class="bg-[#0d1117] border border-[#1e293b] px-1 py-0.5 rounded text-[#3b82f6] text-xs font-mono">$1</code>'
        );
        return (
          <p
            key={i}
            className={line === "" ? "h-2" : ""}
            dangerouslySetInnerHTML={{ __html: withCode }}
          />
        );
      })}
    </div>
  );
}

function InlineMd({ text }: { text: string }) {
  const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  const withCode = withBold.replace(
    /`(.+?)`/g,
    '<code class="bg-[#0d1117] border border-[#1e293b] px-1 py-0.5 rounded text-[#3b82f6] text-xs font-mono">$1</code>'
  );
  return <span dangerouslySetInnerHTML={{ __html: withCode }} />;
}
