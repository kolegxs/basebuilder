import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-[#1e293b] bg-[#0d1117] flex items-center px-6 gap-3 shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#0052ff] flex items-center justify-center shadow-lg"
          style={{ boxShadow: "0 0 12px rgba(0,82,255,0.5)" }}>
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">
          Base<span className="text-[#0052ff]">Builder</span>
        </span>
      </div>

      {/* Badge */}
      <div className="ml-2 px-2 py-0.5 rounded-full bg-[#0052ff]/15 border border-[#0052ff]/30 text-[#3b82f6] text-xs font-medium">
        AgentKit
      </div>

      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-2 text-xs text-[#64748b]">
        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
        <span>Base Sepolia</span>
      </div>

      {/* Docs link */}
      <a
        href="https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors border border-[#1e293b] rounded-md px-3 py-1.5 hover:border-[#3b82f6]/40"
      >
        Docs ↗
      </a>
    </header>
  );
}
