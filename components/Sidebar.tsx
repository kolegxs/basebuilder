"use client";

import { MessageSquare, Wallet, Layers, BarChart2, ExternalLink as GithubIcon } from "lucide-react";
import clsx from "clsx";
import type { ActiveTab } from "@/app/page";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: "chat",
    label: "Agent Chat",
    icon: MessageSquare,
    description: "Talk to your AI agent",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: BarChart2,
    description: "Live onchain balances",
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: Wallet,
    description: "Manage your agent wallet",
  },
  {
    id: "actions",
    label: "Actions",
    icon: Layers,
    description: "Explore available actions",
  },
];

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <aside className="w-56 border-r border-[#1e293b] bg-[#0d1117] flex flex-col shrink-0">
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-[#334155] px-2 py-2 font-semibold">
          Navigation
        </p>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                isActive
                  ? "bg-[#0052ff]/15 border border-[#0052ff]/30 text-white"
                  : "text-[#64748b] hover:text-[#94a3b8] hover:bg-[#111827] border border-transparent"
              )}
            >
              <Icon
                className={clsx(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#3b82f6]" : "text-[#475569] group-hover:text-[#64748b]"
                )}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{tab.label}</div>
                <div className="text-[10px] text-[#475569] truncate mt-0.5">{tab.description}</div>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-3 border-t border-[#1e293b] space-y-2">
        <a
          href="https://github.com/coinbase/agentkit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#475569] hover:text-[#94a3b8] hover:bg-[#111827] transition-all text-xs"
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span>coinbase/agentkit</span>
        </a>
        <div className="px-3 py-2 rounded-lg bg-[#111827] border border-[#1e293b]">
          <div className="text-[10px] text-[#475569] mb-1">Powered by</div>
          <div className="flex flex-wrap gap-1">
            {["AgentKit", "LangChain", "Base"].map((t) => (
              <span
                key={t}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[#0052ff]/10 text-[#3b82f6] border border-[#0052ff]/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
