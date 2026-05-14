"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  TrendingUp,
  Wallet,
  Image,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCheck,
  Info,
} from "lucide-react";
import clsx from "clsx";
import type { PortfolioData, TokenBalance } from "@/app/api/portfolio/route";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUsd(val: number | null, compact = false): string {
  if (val === null) return "—";
  if (compact && val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (compact && val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function formatBalance(balance: string, symbol: string): string {
  const n = parseFloat(balance);
  if (isNaN(n)) return `0 ${symbol}`;
  if (n === 0) return `0 ${symbol}`;
  if (n < 0.000001) return `<0.000001 ${symbol}`;
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${symbol}`;
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortfolioPanel() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [inputAddress, setInputAddress] = useState("");
  const [network, setNetwork] = useState(
    process.env.NEXT_PUBLIC_NETWORK_ID ?? "base-sepolia"
  );
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchPortfolio = useCallback(
    async (addr: string, net: string) => {
      if (!addr) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/portfolio?address=${encodeURIComponent(addr)}&network=${net}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch portfolio");
        setData(json as PortfolioData);
        setLastRefresh(new Date());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch portfolio");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Auto-fetch wallet address from agent API
  useEffect(() => {
    const stored = localStorage.getItem("bb_wallet_address");
    if (stored) {
      setAddress(stored);
      setInputAddress(stored);
      fetchPortfolio(stored, network);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputAddress.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      setError("Please enter a valid Ethereum address (0x...)");
      return;
    }
    setAddress(trimmed);
    localStorage.setItem("bb_wallet_address", trimmed);
    fetchPortfolio(trimmed, network);
  };

  const handleRefresh = () => {
    if (address) fetchPortfolio(address, network);
  };

  const copyAddress = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const basescanUrl = (addr: string) =>
    network === "base-mainnet"
      ? `https://basescan.org/address/${addr}`
      : `https://sepolia.basescan.org/address/${addr}`;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e1a]">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Portfolio</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Live onchain balances · Prices via DefiLlama
            </p>
          </div>
          {data && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94a3b8] border border-[#1e293b] rounded-lg px-3 py-1.5 hover:border-[#334155] transition-all disabled:opacity-50"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          )}
        </div>

        {/* ── Address input ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="bg-[#111827] border border-[#1e293b] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[#3b82f6]" />
            <span className="text-sm font-medium text-[#94a3b8]">Wallet Address</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="0x... enter any Base wallet address"
              className="flex-1 bg-[#0d1117] border border-[#1e293b] rounded-xl px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#334155] focus:outline-none focus:border-[#0052ff]/40 font-mono transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#0052ff] hover:bg-[#0040cc] text-white text-sm font-medium transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
            </button>
          </div>

          {/* Network selector */}
          <div className="flex gap-2">
            {["base-sepolia", "base-mainnet"].map((net) => (
              <button
                key={net}
                type="button"
                onClick={() => {
                  setNetwork(net);
                  if (address) fetchPortfolio(address, net);
                }}
                className={clsx(
                  "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  network === net
                    ? "bg-[#0052ff]/15 border-[#0052ff]/30 text-[#3b82f6]"
                    : "bg-[#0d1117] border-[#1e293b] text-[#475569] hover:border-[#334155]"
                )}
              >
                {net === "base-sepolia" ? "Base Sepolia" : "Base Mainnet"}
              </button>
            ))}
          </div>
        </form>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#fca5a5]">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ───────────────────────────────────────────── */}
        {loading && !data && (
          <div className="space-y-3 animate-pulse">
            <div className="h-32 bg-[#111827] rounded-2xl" />
            <div className="h-48 bg-[#111827] rounded-2xl" />
          </div>
        )}

        {/* ── Portfolio data ─────────────────────────────────────────────── */}
        {data && (
          <>
            {/* Net worth card */}
            <div
              className="rounded-2xl p-5 border border-[#0052ff]/20 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0d1117 0%, #0a0e1a 100%)",
              }}
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#0052ff]/5 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#475569] mb-1">Total Portfolio Value</p>
                    <p className="text-4xl font-bold text-white tracking-tight">
                      {formatUsd(data.totalUsdValue)}
                    </p>
                    {data.totalUsdValue === null && (
                      <p className="text-xs text-[#475569] mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Prices unavailable on testnet
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        network === "base-mainnet"
                          ? "bg-[#0052ff]/15 border-[#0052ff]/30 text-[#3b82f6]"
                          : "bg-[#f59e0b]/15 border-[#f59e0b]/30 text-[#f59e0b]"
                      )}
                    >
                      {network === "base-mainnet" ? "Mainnet" : "Testnet"}
                    </span>
                  </div>
                </div>

                {/* Address row */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs font-mono text-[#475569]">
                    {shortAddress(data.walletAddress)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="text-[#334155] hover:text-[#64748b] transition-colors"
                  >
                    {copied ? (
                      <CheckCheck className="w-3.5 h-3.5 text-[#10b981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={basescanUrl(data.walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#334155] hover:text-[#3b82f6] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {lastRefresh && (
                    <span className="ml-auto text-[10px] text-[#334155]">
                      Updated {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Stats row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="ETH Balance"
                value={formatBalance(data.ethBalance, "ETH")}
                sub={formatUsd(data.ethUsdPrice !== null ? parseFloat(data.ethBalance) * data.ethUsdPrice : null)}
                icon={<TrendingUp className="w-4 h-4 text-[#3b82f6]" />}
              />
              <StatCard
                label="Tokens"
                value={`${data.tokens.length}`}
                sub={`${data.tokens.filter((t) => !t.isNative).length} ERC-20`}
                icon={<Wallet className="w-4 h-4 text-[#10b981]" />}
              />
              <StatCard
                label="NFTs"
                value={`${data.nfts.reduce((s, n) => s + n.count, 0)}`}
                sub={`${data.nfts.length} collection${data.nfts.length !== 1 ? "s" : ""}`}
                icon={<Image className="w-4 h-4 text-[#8b5cf6]" />}
              />
            </div>

            {/* ── Token list ─────────────────────────────────────────────── */}
            <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e293b] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#94a3b8]">Token Balances</span>
                <span className="text-xs text-[#475569]">{data.tokens.length} asset{data.tokens.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-[#0d1117]">
                {data.tokens.map((token) => (
                  <TokenRow key={token.address} token={token} basescanUrl={basescanUrl} />
                ))}
                {data.tokens.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-[#475569]">
                    No token balances found
                  </div>
                )}
              </div>
            </div>

            {/* ── NFT collections ───────────────────────────────────────── */}
            {data.nfts.length > 0 && (
              <div className="bg-[#111827] border border-[#1e293b] rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1e293b] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#94a3b8]">NFT Collections</span>
                  <span className="text-xs text-[#475569]">{data.nfts.length} collection{data.nfts.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-[#0d1117]">
                  {data.nfts.map((nft) => (
                    <div key={nft.contractAddress} className="flex items-center justify-between px-5 py-3 hover:bg-[#0d1117] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
                          <Image className="w-4 h-4 text-[#8b5cf6]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e2e8f0]">{nft.name}</p>
                          <p className="text-xs text-[#475569] font-mono">{shortAddress(nft.contractAddress)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{nft.count}</p>
                        <p className="text-[10px] text-[#475569]">owned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── DefiLlama attribution ─────────────────────────────────── */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#334155]">
              <span>Prices by</span>
              <a
                href="https://defillama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#475569] hover:text-[#3b82f6] transition-colors flex items-center gap-0.5"
              >
                DefiLlama <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span>·</span>
              <span>Onchain data from Base RPC via viem</span>
            </div>
          </>
        )}

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1e293b] flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-[#334155]" />
            </div>
            <p className="text-sm font-medium text-[#475569]">Enter a wallet address above</p>
            <p className="text-xs text-[#334155] max-w-xs">
              Paste any Base wallet address to see live ETH &amp; token balances with USD values
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-[#0d1117] border border-[#1e293b] flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[10px] text-[#475569] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-base font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-[#475569] mt-0.5">{sub}</p>
    </div>
  );
}

function TokenRow({
  token,
  basescanUrl,
}: {
  token: TokenBalance;
  basescanUrl: (addr: string) => string;
}) {
  // allocation bar width
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#0d1117] transition-colors group">
      {/* Logo */}
      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0d1117] border border-[#1e293b] flex items-center justify-center shrink-0">
        {token.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={token.logoUrl}
            alt={token.symbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-xs font-bold text-[#475569]">
            {token.symbol.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Name + address */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#e2e8f0]">{token.symbol}</span>
          {token.isNative && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0052ff]/10 text-[#3b82f6] border border-[#0052ff]/20">
              Native
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-[#475569]">{token.name}</span>
          {!token.isNative && (
            <a
              href={basescanUrl(token.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-3 h-3 text-[#334155] hover:text-[#3b82f6]" />
            </a>
          )}
        </div>
      </div>

      {/* Balance + USD */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-white">
          {formatBalance(token.balance, token.symbol)}
        </p>
        <p className="text-xs text-[#475569] mt-0.5">
          {token.usdValue !== null
            ? formatUsd(token.usdValue)
            : token.usdPrice !== null
            ? formatUsd(token.usdPrice) + " ea"
            : "—"}
        </p>
      </div>
    </div>
  );
}
