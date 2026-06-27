#!/bin/bash
# WattSwap Contract Deployment Script
# Prerequisites: stellar CLI installed, Rust toolchain with wasm32v1-none target
#
# Usage: ./scripts/deploy.sh [network]
#   network: testnet (default) or pubnet

set -e

NETWORK="${1:-testnet}"
echo "🚀 Deploying WattSwap to Stellar $NETWORK..."

# Step 1: Build the contract
echo ""
echo "📦 Building contract..."
cd "$(dirname "$0")/../../contract"
stellar contract build

# Step 2: Generate or use key
echo ""
echo "🔑 Checking wallet..."
if ! stellar keys ls 2>/dev/null | grep -q "dev"; then
  echo "   Creating 'dev' key..."
  stellar keys generate dev --network "$NETWORK" --fund
else
  echo "   Using existing 'dev' key"
fi

# Step 3: Deploy
echo ""
echo "📄 Deploying contract..."
DEPLOY_OUTPUT=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/wattswap.wasm \
  --source-account dev \
  --network "$NETWORK")

echo ""
echo "✅ Deployment complete!"
echo "   Contract ID: $DEPLOY_OUTPUT"

# Step 4: Update client config
echo ""
echo "✏️  Updating client configuration..."
CONFIG_FILE="../client/src/lib/contract.ts"
if [ -f "$CONFIG_FILE" ]; then
  sed -i.bak "s/CONTRACT_ADDRESS = \".*\"/CONTRACT_ADDRESS = \"$DEPLOY_OUTPUT\"/" "$CONFIG_FILE"
  rm -f "${CONFIG_FILE}.bak"
  echo "   Updated $CONFIG_FILE with contract address"
fi

echo ""
echo "🎉 WattSwap is deployed! Contract ID: $DEPLOY_OUTPUT"
echo "   Next steps:"
echo "   1. cd client && npm run dev"
echo "   2. Generate TypeScript bindings: stellar contract bindings typescript --network $NETWORK --contract-id $DEPLOY_OUTPUT --output-dir packages/contract"
echo "   3. Open http://localhost:3000"
