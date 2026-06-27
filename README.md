# WattSwap ⚡

**A decentralized peer-to-peer energy trading platform with smart-meter integration and surplus auctions on Stellar Soroban.**

WattSwap enables prosumers (producer-consumers) to register smart meters, post surplus energy for auction, place bids on available energy, and execute trustless peer-to-peer energy trades — all secured on the Stellar network.

---

## Overview

WattSwap connects energy producers with surplus renewable energy to consumers who need it. Smart meters are registered on-chain, surplus energy is listed via auction-style listings, and trades are settled directly between peers. Every interaction is recorded as an on-chain event, providing full transparency and auditability.

### Core Workflow

1. **Meter Registration** — Producers register their smart meters (ID + capacity)
2. **Post Surplus** — Producers list available energy (kWh) at a price (stroops/kWh)
3. **Place Bid** — Consumers bid on active listings (kWh amount + total price)
4. **Accept Bid** — Producers accept bids, which creates an immutable trade record

---

## Features

### Smart Contract (Soroban)
- Smart meter registration with capacity tracking
- Surplus energy listing with auction mechanics
- Bid placement and acceptance
- Immutable trade history
- On-chain events for every action (meter_reg, surplus, bid, trade)
- Permissionless — no admin roles or central authority

### Frontend (Next.js)
- **Multi-Wallet Support** — Connect with Freighter, Albedo, xBull, Lobstr, Rabet, Hana, and more via StellarWalletsKit
- **StellarWalletsKit** — Built-in wallet selection modal
- **Dark Mode** — System-aware theme toggle
- **Real-Time Updates** — Polling-based event feed and listing updates (10s intervals)
- **Transaction Tracking** — Pending → Success/Failed status with explorer links
- **Toast Notifications** — User-friendly success/error messages via Sonner
- **Responsive Design** — Mobile-friendly layout with shadcn/ui components
- **Skeleton Loaders** — Loading states for all data-dependent sections
- **Empty States** — Clear messaging when no data is available

### Transaction Tracking
- Real-time status updates (pending → success/failed)
- Stellar.explorer links for every transaction
- Method name and parameter display
- Auto-clear and manual clear options

### Event Feed
- Live polling of on-chain contract events
- Event type badges (meter_reg, surplus, bid, trade)
- Parsed event data with human-readable display
- Auto-updating every 10 seconds

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contract** | Rust + Soroban SDK v25 |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Wallet** | StellarWalletsKit (multi-wallet) |
| **Blockchain SDK** | @stellar/stellar-sdk v16 |
| **State Management** | Zustand |
| **Server State** | TanStack Query (React Query) |
| **Notifications** | Sonner |
| **Font** | Geist (Geist Sans + Geist Mono) |

---

## Project Structure

```
wattswap/
├── contract/                          # Soroban smart contract
│   ├── Cargo.toml                     # Workspace root
│   ├── contracts/
│   │   └── contract/
│   │       ├── Cargo.toml             # Contract dependencies
│   │       └── src/
│   │           ├── lib.rs             # Contract logic
│   │           └── test.rs            # Tests (9 passing)
│   └── target/                        # Build artifacts
│
├── client/                            # Next.js frontend
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── providers.tsx          # TanStack Query + Theme + Toaster
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui primitives
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   └── skeleton.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── Contract.tsx           # Main layout orchestrator
│   │   │   ├── MeterRegistration.tsx
│   │   │   ├── SurplusPost.tsx
│   │   │   ├── BidPlacement.tsx
│   │   │   ├── AcceptBidPanel.tsx
│   │   │   ├── TradeHistory.tsx
│   │   │   ├── EventFeed.tsx
│   │   │   └── TransactionTracker.tsx
│   │   ├── hooks/
│   │   │   ├── useWallet.ts           # StellarWalletsKit integration
│   │   │   └── useContract.ts         # Contract read/write helpers
│   │   ├── lib/
│   │   │   ├── contract.ts            # Config (RPC URL, network)
│   │   │   └── utils.ts               # cn() helper
│   │   ├── store/
│   │   │   ├── wallet.ts              # Wallet state (Zustand)
│   │   │   ├── events.ts             # Event feed state
│   │   │   └── transactions.ts       # Transaction tracking state
│   │   └── types/
│   │       └── index.ts               # TypeScript interfaces
│   ├── packages/
│   │   └── contract/                  # Generated TS bindings (post-deploy)
│   ├── scripts/
│   │   ├── deploy.sh                  # Contract deployment
│   │   └── generate-bindings.sh       # TypeScript binding generation
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Setup

### Prerequisites

- **Rust** (stable with `wasm32v1-none` target)
  ```bash
  rustup target add wasm32v1-none
  ```
- **Stellar CLI** (Soroban)
  ```bash
  cargo install --locked stellar-cli
  ```
- **Bun** (runtime + package manager)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
- **Freighter Browser Extension** (for wallet connectivity)

### Environment Variables

Copy `.env.example` to `.env.local` in the client directory:

```bash
cp client/.env.example client/.env.local
```

Key variables:

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract ID | `CONTRACT_ADDRESS_HERE` |
| `NEXT_PUBLIC_RPC_URL` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_NETWORK` | Stellar network | `testnet` |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Network passphrase | `Test SDF Network ; September 2015` |

### Wallet Setup

1. Install the **Freighter** browser extension from [freighter.app](https://www.freighter.app/)
2. Create a new wallet (or import existing)
3. Switch to **Testnet** in Freighter settings
4. Fund your account via the [Stellar Lab](https://lab.stellar.org/account/create) or `stellar keys generate dev --network testnet --fund`

---

## Contract Deployment

### 1. Build the contract

```bash
cd contract
stellar contract build
```

### 2. Generate a funded key (one-time)

```bash
stellar keys generate dev --network testnet --fund
```

### 3. Deploy

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source-account dev \
  --network testnet
```

Save the returned contract ID (`C...`).

### 4. Update client configuration

Set the contract address in `client/src/lib/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "C...";
```

### 5. Generate TypeScript bindings (optional)

```bash
cd client
stellar contract bindings typescript \
  --network testnet \
  --contract-id <CONTRACT_ID> \
  --output-dir packages/contract
```

Then add to `package.json`:
```json
"dependencies": {
  "contract": "file:packages/contract"
}
```

Run `bun install` to link the package.

---

## Local Development

```bash
# Install client dependencies
cd client
bun install

# Start dev server
bun dev

# Open http://localhost:3000
```

### Running Contract Tests

```bash
cd contract
cargo test
```

All 9 tests should pass:

```
test result: ok. 9 passed; 0 failed
```

### Building the Client

```bash
cd client
bun run build
```

---

## Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push the project to a GitHub repository
2. Import into Vercel
3. Set the root directory to `client`
4. Add the environment variables from `.env.example`
5. Deploy!

---

## Smart Contract API

### State-Changing Methods

| Method | Parameters | Auth | Description |
|---|---|---|---|
| `register_meter` | `producer: Address`, `meter_id: String`, `capacity: i128` | `producer` | Register a smart meter |
| `post_surplus` | `producer: Address`, `kwh: i128`, `price_per_kwh: i128` → `u64` | `producer` | List surplus energy for auction |
| `place_bid` | `listing_id: u64`, `bidder: Address`, `kwh_requested: i128`, `total_price: i128` | `bidder` | Place a bid on a listing |
| `accept_bid` | `producer: Address`, `listing_id: u64`, `bidder: Address` → `u64` | `producer` | Accept a bid and create a trade |

### Read-Only Methods

| Method | Parameters | Returns |
|---|---|---|
| `get_meter` | `producer: Address` | `MeterInfo` |
| `get_listing` | `listing_id: u64` | `EnergyListing` |
| `get_bid` | `listing_id: u64`, `bidder: Address` | `Bid` |
| `get_trade` | `trade_id: u64` | `Trade` |
| `get_listings` | — | `Vec<EnergyListing>` |
| `get_trades_for` | `addr: Address` | `Vec<Trade>` |

### Events

| Event | Topics | Data |
|---|---|---|
| `meter_reg` | `Symbol("meter_reg")` | `(producer, meter_id, capacity)` |
| `surplus` | `Symbol("surplus")` | `(producer, listing_id, kwh, price_per_kwh)` |
| `bid` | `Symbol("bid")` | `(listing_id, bidder, kwh_requested, total_price)` |
| `trade` | `Symbol("trade")` | `(trade_id, listing_id, producer, consumer, kwh, total_price)` |

---

## Data Types

```rust
struct MeterInfo {
    meter_id: String,
    capacity: i128,
    active: bool,
}

struct EnergyListing {
    id: u64,
    producer: Address,
    kwh: i128,
    price_per_kwh: i128,
    active: bool,
}

struct Bid {
    bidder: Address,
    kwh_requested: i128,
    total_price: i128,
}

struct Trade {
    id: u64,
    listing_id: u64,
    producer: Address,
    consumer: Address,
    kwh: i128,
    total_price: i128,
    timestamp: u64,
}
```

---

## License

MIT
