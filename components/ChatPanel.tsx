"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { DBMessage } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────

export type UIMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: Date;
};

interface ChatPanelProps {
  /** Active conversation ID from Supabase (null = no persistence / new chat) */
  conversationId: string | null;
  /** Called after the agent replies so parent can refresh the sidebar */
  onConversationUpdate?: (id: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hello! I'm your **Base AI Agent** powered by AgentKit.\n\nI have an onchain wallet on Base Sepolia and can perform real blockchain actions for you:\n\n• 💰 Check balances & transfer tokens\n• 🔗 Register Basenames (.base.eth)\n• 📊 Fetch live prices via Pyth\n• 🪙 Wrap/unwrap ETH\n• 🚰 Request testnet faucet funds\n• 🔄 Swap tokens & interact with DeFi\n\nWhat would you like me to do?",
  timestamp: new Date(),
};

const STARTER_PROMPTS = [
  "What is my wallet address and balance?",
  "Register a Basename for my wallet",
  "Get the current ETH price from Pyth",
  "Request testnet funds from the faucet",
  "What onchain actions can you perform?",
  "Wrap 0.001 ETH to WETH on Base Sepolia",
];

function dbMessageToUI(m: DBMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.created_at),
  };
}

// ── Component ─────────────────────────────────────────────────────────────

export function ChatPanel({ conversationId, onConversationUpdate }: ChatPanelProps) {
  const [messages, setMessages] = useState<UIMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load history when conversationId changes ────────────────────────────
  const loadHistory = useCallback(async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to load history");
      const dbMessages: DBMessage[] = await res.json();
      if (dbMessages.length === 0) {
        setMessages([WELCOME_MESSAGE]);
      } else {
        setMessages(dbMessages.map(dbMessageToUI));
      }
    } catch {
      setMessages([WELCOME_MESSAGE]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadHistory(conversationId);
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [conversationId, loadHistory]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: UIMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          conversationId: conversationId ?? undefined,
          // Fallback history for when Supabase is not configured
          history: messages
            .filter((m) => m.role !== "error" && m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent request failed");

      const assistantMsg: UIMessage = {
        id: `tmp-assistant-${Date.now()}`,
        role: "assistant",
        content: data.output,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Notify parent so the sidebar title refreshes
      if (data.conversationId && onConversationUpdate) {
        onConversationUpdate(data.conversationId);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "error",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => setMessages([WELCOME_MESSAGE]);

  const isFirstMessage =
    messages.length === 1 && messages[0].id === "welcome";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0052ff]/20 border border-[#0052ff]/40 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
          </div>
          <span className="text-sm font-medium text-[#94a3b8]">Base AI Agent</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
            Online
          </span>
          {conversationId && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0052ff]/15 text-[#3b82f6] border border-[#0052ff]/30 font-mono">
              💾 Saved
            </span>
          )}
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94a3b8] transition-colors px-2 py-1 rounded hover:bg-[#111827]"
        >
          <RefreshCw className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-32 gap-2 text-[#475569]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading conversation…</span>
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 fade-in-up">
            <div className="w-7 h-7 rounded-full bg-[#0052ff]/20 border border-[#0052ff]/40 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
            </div>
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="typing-dot w-2 h-2 rounded-full bg-[#3b82f6]" />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts */}
      {isFirstMessage && !loadingHistory && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#475569] mb-2 px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Try asking…
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#1e293b] text-[#64748b] hover:text-[#94a3b8] hover:border-[#334155] hover:bg-[#111827] transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex gap-2 items-end bg-[#111827] border border-[#1e293b] rounded-2xl p-2 focus-within:border-[#0052ff]/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your agent to do something onchain…"
            rows={1}
            disabled={isLoading || loadingHistory}
            className="flex-1 bg-transparent resize-none text-sm text-[#e2e8f0] placeholder:text-[#334155] focus:outline-none px-2 py-1.5 max-h-32"
            style={{ minHeight: "36px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading || loadingHistory}
            className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
              input.trim() && !isLoading && !loadingHistory
                ? "bg-[#0052ff] hover:bg-[#0040cc] text-white shadow-lg"
                : "bg-[#1e293b] text-[#475569] cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#334155] mt-1.5 text-center">
          Press{" "}
          <kbd className="px-1 py-0.5 bg-[#1e293b] rounded text-[#475569]">Enter</kbd>{" "}
          to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end fade-in-up">
        <div className="max-w-[75%] bg-[#0052ff] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-[#64748b]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 fade-in-up">
        <div className="w-7 h-7 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/30 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
        </div>
        <div className="max-w-[80%] bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#fca5a5] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 fade-in-up">
      <div className="w-7 h-7 rounded-full bg-[#0052ff]/20 border border-[#0052ff]/40 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[#3b82f6]" />
      </div>
      <div className="max-w-[80%] bg-[#111827] border border-[#1e293b] text-[#e2e8f0] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed">
        <FormattedContent content={message.content} />
        <div className="text-[10px] text-[#334155] mt-1.5">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  return (
    <div className="space-y-1">
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
            dangerouslySetInnerHTML={{ __html: withCode }}
            className={line === "" ? "h-2" : ""}
          />
        );
      })}
    </div>
  );
}
