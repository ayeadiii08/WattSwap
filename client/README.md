# WattSwap - Peer-to-Peer Energy Trading

A decentralized peer-to-peer energy trading platform built on Stellar Soroban, featuring simulated smart-meter integration and surplus energy auctions.

## Overview

WattSwap enables prosumers (producer-consumers) to:
- **Register smart meters** with capacity and meter ID
- **Post surplus energy** for auction at a set price per kWh
- **Place bids** on available energy listings
- **Accept bids** to complete energy trades
- **Track trades** and view transaction history in real-time

## Features

- ✅ **Soroban Smart Contract** — Custom energy trading logic deployed on Stellar Testnet
- ✅ **Wallet Integration** — Connect via Freighter browser extension (StellarWalletsKit compatible)
- ✅ **Energy Marketplace** — Browse active listings, place bids, accept offers
- ✅ **Smart Meter Registration** — Simulated meter integration with capacity tracking
- ✅ **Transaction Tracking** — Real-time status updates with explorer links
- ✅ **Event Feed** — Live contract events (meter registered, surplus posted, bids, trades)
- ✅ **Dark Mode** — Full dark/light theme support with next-themes
- ✅ **Toast Notifications** — User-friendly feedback via sonner toasts
- ✅ **Responsive UI** — Mobile-friendly with shadcn/ui components
- ✅ **Auto-refresh** — Data updates via TanStack Query polling (10-15s intervals)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Stellar Soroban (smart contracts) |
| Smart Contract | Rust + soroban-sdk v25 |
| Frontend | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Wallet | Freighter (+ StellarWalletsKit compatible) |
| State | Zustand |
| Data Fetching | TanStack Query |
| Notifications | Sonner |
| Theme | next-themes |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Bun](https://bun.sh/) or npm
- [Rust](https://rustup.rs/) with `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli)
- [Freighter Wallet](https://freighter.app/) browser extension

## Setup

### 1. Clone and Install Dependencies

```bash
cd client
bun install
```

### 2. Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your contract address after deployment.

### 3. Deploy the Contract

```bash
# From the client directory
./scripts/deploy.sh testnet
```

This will:
1. Build the Soroban contract
2. Generate a dev key (funded via friendbot)
3. Deploy to testnet
4. Update the contract address in `src/lib/contract.ts`

### 4. Generate TypeScript Bindings (Optional)

```bash
./scripts/generate-bindings.sh <CONTRACT_ID> testnet
```

Then add to `package.json`:
```json
"contract": "file:packages/contract"
```

And run:
```bash
bun install
```

Now you can import the typed client:
```typescript
import * as contract from "contract";
```

### 5. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contract Functions

| Function | Description | Auth |
|----------|-------------|------|
| `register_meter` | Register a smart meter | Producer |
| `post_surplus` | Post surplus energy for auction | Producer |
| `place_bid` | Place a bid on an energy listing | Bidder |
| `accept_bid` | Accept a bid and complete trade | Producer |
| `get_meter` | Get meter info by producer address | Read-only |
| `get_listing` | Get listing details by ID | Read-only |
| `get_bid` | Get bid details | Read-only |
| `get_trade` | Get trade details by ID | Read-only |
| `get_listings` | Get all listings | Read-only |
| `get_trades_for` | Get trades for a participant | Read-only |

## Contract Events

| Event | Trigger | Data |
|-------|---------|------|
| `meter_reg` | Meter registered | producer, meter_id, capacity |
| `surplus` | Surplus posted | producer, listing_id, kwh, price_per_kwh |
| `bid` | Bid placed | listing_id, bidder, kwh_requested, total_price |
| `trade` | Trade completed | trade_id, listing_id, producer, consumer, kwh, total_price |

## Project Structure

```
client/
├── scripts/
│   ├── deploy.sh              # Contract deployment script
│   └── generate-bindings.sh   # TypeScript bindings generator
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with fonts
│   │   ├── page.tsx           # Home page
│   │   ├── providers.tsx      # Theme + Query providers
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── skeleton.tsx
│   │   ├── AcceptBidPanel.tsx
│   │   ├── BidPlacement.tsx
│   │   ├── Contract.tsx       # Main app layout
│   │   ├── EventFeed.tsx
│   │   ├── MeterRegistration.tsx
│   │   ├── Navbar.tsx
│   │   ├── SurplusPost.tsx
│   │   ├── TradeHistory.tsx
│   │   ├── TransactionTracker.tsx
│   │   └── WalletConnect.tsx
│   ├── hooks/
│   │   ├── useContract.ts     # Contract interaction hooks
│   │   └── useWallet.ts       # Wallet integration hooks
│   ├── lib/
│   │   ├── contract.ts        # Contract config
│   │   └── utils.ts           # shadcn/ui utilities
│   ├── store/
│   │   ├── events.ts          # Event store (Zustand)
│   │   ├── transactions.ts    # Transaction store (Zustand)
│   │   └── wallet.ts          # Wallet store (Zustand)
│   └── types/
│       └── index.ts           # TypeScript types
├── packages/
│   └── contract/              # Generated bindings (after deploy)
├── .env.example
├── .env.local
├── package.json
└── README.md

contract/
├── Cargo.toml                 # Workspace root
├── contracts/
│   └── contract/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs         # Contract implementation
│           └── test.rs        # Tests
└── target/
    └── wasm32v1-none/
        └── release/
            └── hello_world.wasm
```

## Vercel Deployment

```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_NETWORK`
- `NEXT_PUBLIC_NETWORK_PASSPHRASE`

## Local Development

```bash
# Terminal 1: Contract tests
cd contract && cargo test

# Terminal 2: Frontend
cd client && bun dev
```

## License

MIT
