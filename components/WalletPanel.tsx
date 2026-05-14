"use client";

import { useState } from "react";
import {
  Wallet,
  Copy,
  CheckCheck,
  ExternalLink,
  RefreshCw,
  Shield,
  Network,
  Key,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const NETWORKS = [
  { id: "base-sepolia", name: "Base Sepolia", color: "#0052ff", testnet: true },
  { id: "base-mainnet", name: "Base Mainnet", color: "#0052ff", testnet: false },
];

export function WalletPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("base-sepolia");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const network = NETWORKS.find((n) => n.id === selectedNetwork)!;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e1a]">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white">Agent Wallet</h2>
          <p className="text-sm text-[#64748b] mt-1">
            Your AI agent's onchain wallet, powered by the Coinbase Developer Platform.
          </p>
        </div>

        {/* Network selector */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-sm font-medium text-[#94a3b8]">Network</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {NETWORKS.map((net) => (
              <button
                key={net.id}
                onClick={() => setSelectedNetwork(net.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedNetwork === net.id
                    ? "border-[#0052ff]/40 bg-[#0052ff]/10 text-white"
                    : "border-[#1e293b] text-[#64748b] hover:border-[#334155] hover:bg-[#0d1117]"
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: net.color,
                    boxShadow:
                      selectedNetwork === net.id ? `0 0 8px ${net.color}` : "none",
                  }}
                />
                <div>
                  <div className="text-sm font-medium leading-tight">{net.name}</div>
                  {net.testnet && (
                    <div className="text-[10px] text-[#475569]">Testnet</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet setup card */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-[#94a3b8]">CDP Wallet Provider</span>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
              CdpEvmWalletProvider
            </span>
          </div>

          {/* Config fields */}
          <div className="space-y-3">
            <ConfigField
              label="CDP_API_KEY_ID"
              value="Set in .env.local"
              icon={<Key className="w-3.5 h-3.5" />}
              masked
            />
            <ConfigField
              label="CDP_API_KEY_SECRET"
              value="Set in .env.local"
              icon={<Shield className="w-3.5 h-3.5" />}
              masked
            />
            <ConfigField
              label="CDP_WALLET_SECRET"
              value="Set in .env.local"
              icon={<Shield className="w-3.5 h-3.5" />}
              masked
            />
            <ConfigField
              label="NETWORK_ID"
              value={network.id}
              icon={<Network className="w-3.5 h-3.5" />}
              onCopy={() => copyToClipboard(network.id, "network")}
              copied={copied === "network"}
            />
          </div>
        </div>

        {/* Wallet types */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-sm font-medium text-[#94a3b8]">Supported Wallet Providers</span>
          </div>
          <div className="space-y-2.5">
            {WALLET_PROVIDERS.map((wp) => (
              <WalletProviderCard key={wp.name} {...wp} />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5">
          <p className="text-sm font-medium text-[#94a3b8] mb-4">Quick Agent Commands</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#0d1117] border border-[#1e293b] hover:border-[#334155] transition-all cursor-default"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#3b82f6]" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#94a3b8]">{cmd.label}</div>
                    <div className="text-[10px] text-[#475569] mt-0.5">{cmd.prompt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BaseScan link */}
        <a
          href={`https://${selectedNetwork === "base-sepolia" ? "sepolia." : ""}basescan.org`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-[#111827] border border-[#1e293b] rounded-2xl hover:border-[#0052ff]/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#94a3b8] group-hover:text-white transition-colors">
                {selectedNetwork === "base-sepolia" ? "Sepolia " : ""}BaseScan
              </div>
              <div className="text-[10px] text-[#475569]">Block explorer for {network.name}</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#475569] group-hover:text-[#3b82f6] transition-colors" />
        </a>

        {/* Setup instructions */}
        <div className="bg-[#0d1117] border border-[#1e293b] rounded-2xl p-5">
          <p className="text-sm font-semibold text-[#94a3b8] mb-3">⚡ Quick Setup</p>
          <ol className="space-y-2 text-sm text-[#64748b]">
            {[
              <>Get a free CDP API key at <a href="https://portal.cdp.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">portal.cdp.coinbase.com</a></>,
              "Copy .env.example → .env.local and fill in your keys",
              "Get testnet ETH from the faucet via the chat agent",
              "Start chatting — your agent has a real onchain wallet!",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-[#0052ff]/15 text-[#3b82f6] text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold border border-[#0052ff]/20">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ConfigField({
  label,
  value,
  icon,
  masked,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  masked?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-[#0d1117] rounded-xl border border-[#1e293b]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[#475569] shrink-0">{icon}</span>
        <span className="text-xs font-mono text-[#475569] shrink-0">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#64748b] truncate max-w-[150px]">
          {masked ? "••••••••••••" : value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-[#475569] hover:text-[#94a3b8] transition-colors shrink-0"
          >
            {copied ? (
              <CheckCheck className="w-3.5 h-3.5 text-[#10b981]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function WalletProviderCard({
  name,
  description,
  badge,
  recommended,
}: {
  name: string;
  description: string;
  badge: string;
  recommended?: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-3 bg-[#0d1117] rounded-xl border border-[#1e293b]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#94a3b8]">{name}</span>
          {recommended && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
              Recommended
            </span>
          )}
        </div>
        <p className="text-xs text-[#475569] mt-0.5">{description}</p>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded bg-[#0052ff]/10 text-[#3b82f6] border border-[#0052ff]/20 shrink-0 ml-2 font-mono">
        {badge}
      </span>
    </div>
  );
}

const WALLET_PROVIDERS = [
  {
    name: "CDP EVM Wallet",
    description: "Coinbase Developer Platform non-custodial EVM wallet. Supports Base + all EVM chains.",
    badge: "CdpEvmWalletProvider",
    recommended: true,
  },
  {
    name: "CDP Smart Wallet",
    description: "ERC-4337 smart wallet with gasless transactions, batch ops. Base only.",
    badge: "CdpSmartWalletProvider",
  },
  {
    name: "Viem Wallet",
    description: "Bring your own private key. Compatible with any EVM chain via viem.",
    badge: "ViemWalletProvider",
  },
  {
    name: "Privy Wallet",
    description: "Server-side and embedded wallets via Privy. Supports delegation.",
    badge: "PrivyWalletProvider",
  },
];

const QUICK_COMMANDS = [
  {
    label: "Check Balance",
    prompt: "What is my wallet address and ETH balance?",
    icon: Wallet,
  },
  {
    label: "Get Faucet ETH",
    prompt: "Request testnet funds from the faucet",
    icon: ArrowDownLeft,
  },
  {
    label: "Transfer ETH",
    prompt: "Transfer 0.001 ETH to 0x...",
    icon: ArrowUpRight,
  },
  {
    label: "Wrap ETH",
    prompt: "Wrap 0.001 ETH to WETH",
    icon: RefreshCw,
  },
];
