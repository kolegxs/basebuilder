"use client";

import { useState } from "react";
import {
  Search,
  Zap,
  ArrowLeftRight,
  Coins,
  Globe,
  Image,
  TrendingUp,
  MessageCircle,
  Droplets,
  Box,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import clsx from "clsx";

type Action = {
  name: string;
  description: string;
};

type Provider = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  actions: Action[];
  docsUrl?: string;
  tag?: string;
};

const ACTION_PROVIDERS: Provider[] = [
  {
    id: "wallet",
    name: "Wallet",
    description: "Core wallet operations — balances, transfers, and wallet info.",
    icon: Coins,
    color: "#0052ff",
    tag: "Core",
    actions: [
      { name: "get_wallet_details", description: "Retrieves wallet address, network info, balances, and provider details." },
      { name: "native_transfer", description: "Transfers native blockchain tokens (e.g., ETH) to a destination address." },
    ],
  },
  {
    id: "weth",
    name: "WETH",
    description: "Wrap and unwrap native ETH to/from Wrapped ETH on Base.",
    icon: ArrowLeftRight,
    color: "#6366f1",
    tag: "DeFi",
    actions: [
      { name: "wrap_eth", description: "Converts native ETH to Wrapped ETH (WETH) on Base Sepolia or Base Mainnet." },
      { name: "unwrap_eth", description: "Converts Wrapped ETH (WETH) to Native ETH on Base Sepolia or Base Mainnet." },
    ],
  },
  {
    id: "erc20",
    name: "ERC-20",
    description: "Interact with any ERC-20 token — balances, transfers, and approvals.",
    icon: Coins,
    color: "#10b981",
    tag: "Tokens",
    actions: [
      { name: "get_balance", description: "Retrieves the token balance for a specified address and ERC-20 contract." },
      { name: "transfer", description: "Transfers a specified amount of ERC-20 tokens to a destination address." },
      { name: "approve", description: "Approves a spender to transfer ERC-20 tokens on behalf of the wallet." },
      { name: "get_allowance", description: "Checks the allowance amount for a spender of an ERC-20 token." },
      { name: "get_erc20_token_address", description: "Gets the contract address for frequently used ERC20 tokens by symbol." },
    ],
  },
  {
    id: "erc721",
    name: "ERC-721 (NFT)",
    description: "Mint, transfer, and check balances of NFTs.",
    icon: Image,
    color: "#8b5cf6",
    tag: "NFTs",
    actions: [
      { name: "get_balance", description: "Retrieves the NFT balance for a specified address and ERC-721 contract." },
      { name: "mint", description: "Creates a new NFT token and assigns it to a specified destination address." },
      { name: "transfer", description: "Transfers ownership of a specific NFT token to a destination address." },
    ],
  },
  {
    id: "basename",
    name: "Basename",
    description: "Register .base.eth domain names for wallet addresses.",
    icon: Globe,
    color: "#0052ff",
    tag: "Identity",
    docsUrl: "https://docs.base.org/identity/basenames",
    actions: [
      { name: "register_basename", description: "Registers a custom .base.eth or .basetest.eth domain name for the wallet address." },
    ],
  },
  {
    id: "pyth",
    name: "Pyth Oracle",
    description: "Fetch real-time price feeds from Pyth Network.",
    icon: TrendingUp,
    color: "#f59e0b",
    tag: "Oracles",
    docsUrl: "https://pyth.network/",
    actions: [
      { name: "fetch_price", description: "Retrieves current price data from a specified Pyth price feed." },
      { name: "fetch_price_feed_id", description: "Retrieves the unique price feed identifier for a given asset symbol." },
    ],
  },
  {
    id: "cdpapi",
    name: "CDP API",
    description: "Access Coinbase Developer Platform APIs directly.",
    icon: Droplets,
    color: "#0052ff",
    tag: "CDP",
    docsUrl: "https://docs.cdp.coinbase.com",
    actions: [
      { name: "request_faucet_funds", description: "Requests test tokens from the CDP faucet for base-sepolia, ethereum-sepolia, or solana-devnet." },
    ],
  },
  {
    id: "cdp_evm_wallet",
    name: "CDP EVM Wallet",
    description: "Advanced EVM wallet operations including swaps.",
    icon: ArrowLeftRight,
    color: "#0052ff",
    tag: "CDP",
    actions: [
      { name: "get_swap_price", description: "Fetches a price quote for swapping between two tokens using the CDP Swap API." },
      { name: "swap", description: "Executes a token swap using the CDP Swap API with automatic token approvals." },
      { name: "list_spend_permissions", description: "Lists spend permissions granted to the current EVM wallet." },
      { name: "use_spend_permission", description: "Uses a spend permission to spend tokens on behalf of a smart account." },
    ],
  },
  {
    id: "morpho",
    name: "Morpho",
    description: "Deposit and withdraw from Morpho yield vaults.",
    icon: TrendingUp,
    color: "#3b82f6",
    tag: "DeFi",
    docsUrl: "https://morpho.org/",
    actions: [
      { name: "deposit", description: "Deposits a specified amount of assets into a designated Morpho Vault." },
      { name: "withdraw", description: "Withdraws a specified amount of assets from a designated Morpho Vault." },
    ],
  },
  {
    id: "compound",
    name: "Compound",
    description: "Lend, borrow, and manage positions on Compound Finance.",
    icon: TrendingUp,
    color: "#00d395",
    tag: "DeFi",
    docsUrl: "https://compound.finance/",
    actions: [
      { name: "supply", description: "Supplies collateral assets (WETH, CBETH, CBBTC, WSTETH, or USDC) to Compound." },
      { name: "withdraw", description: "Withdraws previously supplied collateral assets from Compound." },
      { name: "borrow", description: "Borrows base assets (WETH or USDC) from Compound using supplied collateral." },
      { name: "repay", description: "Repays borrowed assets back to Compound." },
      { name: "get_portfolio", description: "Retrieves portfolio details including collateral balances and borrowed amounts." },
    ],
  },
  {
    id: "farcaster",
    name: "Farcaster",
    description: "Post casts and fetch account info on the Farcaster social network.",
    icon: Globe,
    color: "#8b5cf6",
    tag: "Social",
    docsUrl: "https://farcaster.xyz/",
    actions: [
      { name: "account_details", description: "Fetches profile information and metadata for the authenticated Farcaster account." },
      { name: "post_cast", description: "Creates a new cast on Farcaster with up to 280 characters." },
    ],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description: "Post tweets, reply, and manage your Twitter account.",
    icon: MessageCircle,
    color: "#1d9bf0",
    tag: "Social",
    actions: [
      { name: "post_tweet", description: "Creates a new tweet on the authenticated Twitter account." },
      { name: "post_tweet_reply", description: "Creates a reply to an existing tweet." },
      { name: "account_details", description: "Fetches profile information for the authenticated Twitter account." },
      { name: "account_mentions", description: "Retrieves recent mentions and interactions for the authenticated account." },
      { name: "upload_media", description: "Uploads media (images, videos) to Twitter that can be attached to tweets." },
    ],
  },
  {
    id: "wow",
    name: "WOW Tokens",
    description: "Create and trade WOW memecoins with bonding curve pricing via Zora.",
    icon: Zap,
    color: "#f59e0b",
    tag: "Memecoins",
    actions: [
      { name: "create_token", description: "Creates a new WOW memecoin with bonding curve functionality via Zora factory." },
      { name: "buy_token", description: "Purchases WOW tokens from a contract using ETH based on bonding curve pricing." },
      { name: "sell_token", description: "Sells WOW tokens back to the contract for ETH based on bonding curve pricing." },
    ],
  },
  {
    id: "clanker",
    name: "Clanker",
    description: "Deploy ERC-20 tokens on Base using the Clanker protocol.",
    icon: Box,
    color: "#ec4899",
    tag: "Tokens",
    actions: [
      { name: "clank_token", description: "Deploys an ERC20 Clanker token based on the supplied config." },
    ],
  },
  {
    id: "defi_llama",
    name: "DefiLlama",
    description: "Fetch DeFi protocol data, TVL, and token prices.",
    icon: TrendingUp,
    color: "#10b981",
    tag: "Data",
    docsUrl: "https://defillama.com/",
    actions: [
      { name: "find_protocol", description: "Searches for DeFi protocols by name, returning metadata including TVL." },
      { name: "get_protocol", description: "Fetches detailed information about a specific protocol including historical data." },
      { name: "get_token_prices", description: "Fetches current token prices from DefiLlama for specified token addresses." },
    ],
  },
];

const TAGS = ["All", "Core", "DeFi", "Tokens", "NFTs", "Identity", "Social", "Oracles", "Data", "CDP", "Memecoins"];

export function ActionsPanel() {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>("wallet");

  const filtered = ACTION_PROVIDERS.filter((p) => {
    const matchesTag = selectedTag === "All" || p.tag === selectedTag;
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.actions.some(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase())
      );
    return matchesTag && matchesSearch;
  });

  const totalActions = ACTION_PROVIDERS.reduce((sum, p) => sum + p.actions.length, 0);

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-[#1e293b] bg-[#0d1117] shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Action Providers</h2>
            <p className="text-xs text-[#64748b]">
              {ACTION_PROVIDERS.length} providers · {totalActions} total actions
            </p>
          </div>
          <a
            href="https://github.com/coinbase/agentkit/blob/main/typescript/agentkit/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#3b82f6] border border-[#1e293b] rounded-lg px-3 py-1.5 hover:border-[#3b82f6]/30 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Full Docs
          </a>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#334155]" />
          <input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1e293b] rounded-xl pl-9 pr-4 py-2 text-sm text-[#e2e8f0] placeholder:text-[#334155] focus:outline-none focus:border-[#0052ff]/40 transition-colors"
          />
        </div>

        {/* Tag filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={clsx(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all",
                selectedTag === tag
                  ? "bg-[#0052ff] text-white"
                  : "bg-[#111827] text-[#64748b] border border-[#1e293b] hover:border-[#334155] hover:text-[#94a3b8]"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Providers list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#475569]">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No actions found for "{search}"</p>
          </div>
        ) : (
          filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              expanded={expandedId === provider.id}
              onToggle={() =>
                setExpandedId(expandedId === provider.id ? null : provider.id)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  expanded,
  onToggle,
}: {
  provider: Provider;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = provider.icon;

  return (
    <div
      className={clsx(
        "bg-[#111827] border rounded-xl overflow-hidden transition-all",
        expanded ? "border-[#1e293b]" : "border-[#1e293b] hover:border-[#334155]"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${provider.color}20`,
            border: `1px solid ${provider.color}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: provider.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#e2e8f0]">{provider.name}</span>
            {provider.tag && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${provider.color}15`,
                  color: provider.color,
                  border: `1px solid ${provider.color}25`,
                }}
              >
                {provider.tag}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748b] truncate mt-0.5">{provider.description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#475569] bg-[#0d1117] border border-[#1e293b] px-2 py-0.5 rounded-full">
            {provider.actions.length} {provider.actions.length === 1 ? "action" : "actions"}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[#475569]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#475569]" />
          )}
        </div>
      </button>

      {/* Actions list */}
      {expanded && (
        <div className="border-t border-[#1e293b] divide-y divide-[#0d1117]">
          {provider.actions.map((action) => (
            <div key={action.name} className="flex items-start gap-3 px-4 py-3 hover:bg-[#0d1117] transition-colors">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: provider.color }}
              />
              <div className="min-w-0">
                <code className="text-xs font-mono text-[#3b82f6]">{action.name}</code>
                <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{action.description}</p>
              </div>
            </div>
          ))}

          {provider.docsUrl && (
            <div className="px-4 py-3 bg-[#0d1117]">
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#3b82f6] transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View documentation
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
