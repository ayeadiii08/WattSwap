# WattSwap - Development Lessons

## Contract
- soroban-sdk v25 uses `env.events().publish()` (deprecated but functional). Newer versions use `#[contractevent]` macro.
- Storage: `instance` for global config, `persistent` for per-entity data with TTL extension via `extend_ttl`.
- Vec uses `push_back()` NOT `push()`. Custom structs in Vec need `#[derive(Clone)]`.
- Map takes OWNED keys, NOT references: `map.get(key.clone())` NOT `map.get(&key)`.
- Storage keys via `#[contracttype]` enum, used by `&` reference in storage calls.
- `Address::generate(&env)` requires `use soroban_sdk::testutils::Address as _;`.
- `env.register(Contract, ())` NOT `env.register_contract()`.

## Frontend
- Stellar SDK v16 structure: `Contract`, `TransactionBuilder`, `BASE_FEE`, `nativeToScVal`, `scValToNative`, `rpc`, `xdr`, `Address` imported from `@stellar/stellar-sdk`.
- `rpc.Server` has methods: `getAccount`, `simulateTransaction`, `getEvents`, `getLatestLedger`.
- `rpc.Api.isSimulationError()` for checking simulation errors.
- `rpc.assembleTransaction()` for preparing simulated transactions.
- `TransactionSource` interface needs: `accountId()`, `sequenceNumber()`, `incrementSequenceNumber()`.
- `@stellar/freighter-api` v6: `isConnected`, `isAllowed`, `requestAccess`, `getAddress`, `signTransaction`.
- Next.js 16 uses Turbopack by default.
- `@tanstack/react-query` v5: `useQuery` with `refetchInterval` for polling.
- shadcn/ui: create components manually in `src/components/ui/`.

## Build
- Contract: `cd contract && stellar contract build && stellar contract deploy`
- Frontend: `cd client && bun install && bun run build`
- TypeScript bindings: `stellar contract bindings typescript --network testnet --contract-id C... --output-dir packages/contract`

## Fixes Applied (June 2026)
1. Renamed contract package from `hello-world` → `wattswap` in Cargo.toml
2. Fixed deploy.sh wasm path from `hello_world.wasm` → `wattswap.wasm`
3. Both `cargo test` (9/9 passing) and `bun run build` verified working
