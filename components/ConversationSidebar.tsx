"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";
import clsx from "clsx";
import type { Conversation } from "@/lib/supabase";

interface ConversationSidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: (id: string) => void;
}

export function ConversationSidebar({
  activeId,
  onSelect,
  onNew,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ── Fetch conversations ────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/conversations");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load conversations");
      }
      const data: Conversation[] = await res.json();
      setConversations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Create new conversation ───────────────────────────────────────────
  const handleNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      const convo: Conversation = await res.json();
      setConversations((prev) => [convo, ...prev]);
      onNew(convo.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete a conversation ─────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setConversations((prev) => prev.filter((c) => c.id !== id));
      // If we deleted the active conversation, pick the next one or null
      if (activeId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) onSelect(remaining[0].id);
        else onNew(""); // signal no active conversation
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0a0e1a] border-r border-[#1e293b]" style={{ width: 220 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#1e293b] shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
            Chats
          </span>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          title="New conversation"
          className="w-6 h-6 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center text-[#3b82f6] hover:bg-[#0052ff]/20 transition-all disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#475569]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : error ? (
          <div className="mx-2 mt-2 p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#ef4444] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-[#fca5a5] font-medium">No DB</p>
                <p className="text-[10px] text-[#f87171] mt-0.5 leading-relaxed">
                  Set Supabase keys in .env.local to enable memory
                </p>
              </div>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#334155] px-3 text-center">
            <MessageSquare className="w-6 h-6 opacity-40" />
            <p className="text-xs">No conversations yet</p>
            <button
              onClick={handleNew}
              className="text-xs text-[#3b82f6] hover:underline"
            >
              Start one →
            </button>
          </div>
        ) : (
          conversations.map((convo) => {
            const isActive = convo.id === activeId;
            const isDeleting = deletingId === convo.id;
            return (
              <button
                key={convo.id}
                onClick={() => onSelect(convo.id)}
                className={clsx(
                  "w-full text-left px-3 py-2.5 flex items-start gap-2 group transition-all relative",
                  isActive
                    ? "bg-[#0052ff]/10 border-r-2 border-[#0052ff]"
                    : "hover:bg-[#111827]"
                )}
              >
                <MessageSquare
                  className={clsx(
                    "w-3.5 h-3.5 mt-0.5 shrink-0",
                    isActive ? "text-[#3b82f6]" : "text-[#334155]"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      "text-xs font-medium truncate leading-tight",
                      isActive ? "text-white" : "text-[#64748b]"
                    )}
                  >
                    {convo.title}
                  </p>
                  <p className="text-[10px] text-[#334155] mt-0.5">
                    {formatDate(convo.updated_at)}
                  </p>
                </div>
                {/* Delete button — shows on hover */}
                <button
                  onClick={(e) => handleDelete(e, convo.id)}
                  disabled={!!deletingId}
                  className={clsx(
                    "shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all",
                    "opacity-0 group-hover:opacity-100",
                    "text-[#475569] hover:text-[#ef4444] hover:bg-[#ef4444]/10"
                  )}
                >
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[#1e293b] shrink-0">
        <div className="flex items-center gap-1.5">
          <div
            className={clsx(
              "w-1.5 h-1.5 rounded-full",
              error ? "bg-[#ef4444]" : "bg-[#10b981]"
            )}
          />
          <span className="text-[10px] text-[#334155]">
            {error ? "Memory offline" : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>
    </div>
  );
}
