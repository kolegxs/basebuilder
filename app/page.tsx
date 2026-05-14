"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { WalletPanel } from "@/components/WalletPanel";
import { ActionsPanel } from "@/components/ActionsPanel";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ConversationSidebar } from "@/components/ConversationSidebar";

export type ActiveTab = "chat" | "wallet" | "actions";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  // Key to force a sidebar re-fetch after agent replies
  const [sidebarVersion, setSidebarVersion] = useState(0);

  const handleConversationUpdate = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarVersion((v) => v + 1);
  }, []);

  const handleNewConversation = useCallback((id: string) => {
    setActiveConversationId(id || null);
    setSidebarVersion((v) => v + 1);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Conversation history sidebar — only visible in chat tab */}
        {activeTab === "chat" && (
          <ConversationSidebar
            key={sidebarVersion}
            activeId={activeConversationId}
            onSelect={setActiveConversationId}
            onNew={handleNewConversation}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "chat" && (
            <ChatPanel
              conversationId={activeConversationId}
              onConversationUpdate={handleConversationUpdate}
            />
          )}
          {activeTab === "wallet" && <WalletPanel />}
          {activeTab === "actions" && <ActionsPanel />}
        </main>
      </div>
    </div>
  );
}
