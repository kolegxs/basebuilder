"use client";

import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { WalletPanel } from "@/components/WalletPanel";
import { ActionsPanel } from "@/components/ActionsPanel";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export type ActiveTab = "chat" | "wallet" | "actions";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "chat" && <ChatPanel />}
          {activeTab === "wallet" && <WalletPanel />}
          {activeTab === "actions" && <ActionsPanel />}
        </main>
      </div>
    </div>
  );
}
