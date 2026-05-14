import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  type Address,
} from "viem";
import { base, baseSepolia } from "viem/chains";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TokenBalance = {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string;       // human-readable
  balanceRaw: string;    // wei / atomic units
  usdPrice: number | null;
  usdValue: number | null;
  logoUrl: string | null;
  isNative: boolean;
};

export type NFTCollection = {
  contractAddress: string;
  name: string;
  count: number;
};

export type PortfolioData = {
  walletAddress: string;
  network: string;
  totalUsdValue: number | null;
  ethBalance: string;
  ethUsdPrice: number | null;
  tokens: TokenBalance[];
  nfts: NFTCollection[];
  lastUpdated: string;
};

// ─── Well-known ERC-20 tokens on Base ────────────────────────────────────────

const BASE_TOKENS: { symbol: string; name: string; address: Address; decimals: number; logoUrl: string }[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    logoUrl: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
    logoUrl: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  },
  {
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    decimals: 18,
    logoUrl: "https://assets.coingecko.com/coins/images/27008/small/cbeth.png",
  },
  {
    symbol: "TOSHI",
    name: "Toshi",
    address: "0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4",
    decimals: 18,
    logoUrl: "https://assets.coingecko.com/coins/images/31126/small/toshi.jpg",
  },
];

const BASE_SEPOLIA_TOKENS: { symbol: string; name: string; address: Address; decimals: number; logoUrl: string }[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    decimals: 6,
    logoUrl: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
    logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  },
];

// ERC-20 balanceOf ABI
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ERC-721 balanceOf ABI
const ERC721_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

// Well-known NFT contracts on Base mainnet to check
const BASE_NFTS: { address: Address; name: string }[] = [
  { address: "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401", name: "Base Names" },
  { address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", name: "BAYC" },
];

// ─── DefiLlama price fetcher ──────────────────────────────────────────────────

async function fetchUsdPrices(
  networkPrefix: string,
  addresses: string[]
): Promise<Record<string, number>> {
  try {
    const coins = addresses.map((a) => `${networkPrefix}:${a}`).join(",");
    const res = await fetch(
      `https://coins.llama.fi/prices/current/${coins}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const prices: Record<string, number> = {};
    for (const [key, val] of Object.entries(data.coins ?? {})) {
      const addr = key.split(":")[1]?.toLowerCase();
      if (addr) prices[addr] = (val as { price: number }).price;
    }
    return prices;
  } catch {
    return {};
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address") as Address | null;
    const networkId = searchParams.get("network") ?? process.env.NETWORK_ID ?? "base-sepolia";

    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Valid wallet address required (?address=0x...)" },
        { status: 400 }
      );
    }

    const isMainnet = networkId === "base-mainnet";
    const chain = isMainnet ? base : baseSepolia;
    const llamaPrefix = isMainnet ? "base" : "base-sepolia";
    const tokenList = isMainnet ? BASE_TOKENS : BASE_SEPOLIA_TOKENS;

    const client = createPublicClient({
      chain,
      transport: http(
        isMainnet
          ? (process.env.BASE_RPC_URL ?? "https://mainnet.base.org")
          : (process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org")
      ),
    });

    // ── 1. ETH balance ───────────────────────────────────────────────────────
    const ethBalanceRaw = await client.getBalance({ address });
    const ethBalance = formatEther(ethBalanceRaw);

    // ── 2. ERC-20 balances (multicall) ───────────────────────────────────────
    const erc20Results = await client.multicall({
      contracts: tokenList.map((t) => ({
        address: t.address,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      })),
      allowFailure: true,
    });

    // ── 3. USD prices from DefiLlama ─────────────────────────────────────────
    const allAddresses = [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // native ETH
      ...tokenList.map((t) => t.address),
    ];
    const prices = await fetchUsdPrices(llamaPrefix, allAddresses);
    const ethPrice = prices["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"] ?? null;

    // ── 4. Build token list ──────────────────────────────────────────────────
    const tokens: TokenBalance[] = [];

    // Native ETH entry
    const ethUsdValue = ethPrice ? parseFloat(ethBalance) * ethPrice : null;
    tokens.push({
      symbol: "ETH",
      name: "Ether",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: 18,
      balance: parseFloat(ethBalance).toFixed(6),
      balanceRaw: ethBalanceRaw.toString(),
      usdPrice: ethPrice,
      usdValue: ethUsdValue,
      logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      isNative: true,
    });

    // ERC-20 tokens with non-zero balance
    for (let i = 0; i < tokenList.length; i++) {
      const token = tokenList[i];
      const result = erc20Results[i];
      if (result.status !== "success") continue;
      const raw = result.result as bigint;
      if (raw === BigInt(0)) continue;

      const humanBalance = formatUnits(raw, token.decimals);
      const usdPrice = prices[token.address.toLowerCase()] ?? null;
      const usdValue = usdPrice ? parseFloat(humanBalance) * usdPrice : null;

      tokens.push({
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        balance: parseFloat(humanBalance).toFixed(token.decimals > 6 ? 6 : token.decimals),
        balanceRaw: raw.toString(),
        usdPrice,
        usdValue,
        logoUrl: token.logoUrl,
        isNative: false,
      });
    }

    // ── 5. NFT balances ──────────────────────────────────────────────────────
    const nfts: NFTCollection[] = [];
    if (isMainnet) {
      const nftResults = await client.multicall({
        contracts: BASE_NFTS.map((n) => ({
          address: n.address,
          abi: ERC721_ABI,
          functionName: "balanceOf",
          args: [address],
        })),
        allowFailure: true,
      });
      for (let i = 0; i < BASE_NFTS.length; i++) {
        const res = nftResults[i];
        if (res.status !== "success") continue;
        const count = Number(res.result as unknown as bigint);
        if (count > 0) {
          nfts.push({ contractAddress: BASE_NFTS[i].address, name: BASE_NFTS[i].name, count });
        }
      }
    }

    // ── 6. Total USD value ───────────────────────────────────────────────────
    const totalUsdValue = tokens.every((t) => t.usdValue === null)
      ? null
      : tokens.reduce((sum, t) => sum + (t.usdValue ?? 0), 0);

    const portfolio: PortfolioData = {
      walletAddress: address,
      network: networkId,
      totalUsdValue,
      ethBalance: parseFloat(ethBalance).toFixed(6),
      ethUsdPrice: ethPrice,
      tokens,
      nfts,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(portfolio);
  } catch (err: unknown) {
    console.error("[Portfolio API]", err);
    const message = err instanceof Error ? err.message : "Failed to fetch portfolio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
