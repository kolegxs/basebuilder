# BaseBuilder — AI Agent Toolkit on Base 🤖⛓️

A full-stack Next.js app for building and interacting with AI agents on the [Base](https://base.org) ecosystem, powered by [Coinbase AgentKit](https://github.com/coinbase/agentkit).

![BaseBuilder](https://img.shields.io/badge/Base-Ecosystem-0052ff?style=flat&logo=ethereum)
![AgentKit](https://img.shields.io/badge/AgentKit-Coinbase-blue?style=flat)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=nextdotjs)

## ✨ Features

- **🤖 AI Agent Chat** — Conversational interface to interact with your onchain AI agent
- **💰 Wallet Panel** — View and manage your agent's CDP-powered wallet on Base
- **⚡ Actions Explorer** — Browse all 40+ available onchain action providers
- **🔗 Real Onchain Actions** — Agent has a real wallet and can execute transactions

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| AI Framework | LangChain + LangGraph (ReAct agent) |
| LLM | OpenAI GPT-4o-mini |
| Wallet | Coinbase CDP (`CdpEvmWalletProvider`) |
| Onchain | `@coinbase/agentkit` |
| Chain | Base Sepolia / Base Mainnet |

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/kolegxs/basebuilder
cd basebuilder
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:

| Variable | Where to get it |
|---|---|
| `CDP_API_KEY_ID` | [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com) |
| `CDP_API_KEY_SECRET` | [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com) |
| `CDP_WALLET_SECRET` | [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🤖 What Can the Agent Do?

Your agent has a real onchain wallet and can:

- ✅ Check wallet address and ETH balance
- ✅ Transfer ETH and ERC-20 tokens
- ✅ Wrap/unwrap ETH ↔ WETH
- ✅ Register `.base.eth` Basenames
- ✅ Fetch real-time prices (Pyth oracle)
- ✅ Request testnet faucet funds
- ✅ Interact with NFTs (ERC-721)
- ✅ Token swaps via CDP Swap API
- ✅ DeFi integrations (Morpho, Compound)
- ✅ Social (Farcaster, Twitter)
- ✅ Launch memecoins (WOW, Clanker)

## 📁 Project Structure

```
basebuilder/
├── app/
│   ├── api/agent/route.ts   # AI agent API endpoint (LangChain + AgentKit)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── Header.tsx           # App header
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── ChatPanel.tsx        # AI agent chat interface
│   ├── WalletPanel.tsx      # Wallet info and setup guide
│   └── ActionsPanel.tsx     # Onchain actions explorer
├── .env.example             # Environment variables template
└── next.config.ts           # Next.js configuration
```

## 🔑 API Keys

- **CDP Keys** — Free at [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com). Gives your agent a managed wallet.
- **OpenAI Key** — Required for the LLM. GPT-4o-mini is very cost-effective.

## 📚 Resources

- [AgentKit Docs](https://docs.cdp.coinbase.com/agent-kit/getting-started/quickstart)
- [Base Docs](https://docs.base.org)
- [OnchainKit](https://onchainkit.xyz)
- [CDP Portal](https://portal.cdp.coinbase.com)

## 📄 License

MIT
