#!/bin/bash
# Generate TypeScript bindings for the deployed WattSwap contract
#
# Usage: ./scripts/generate-bindings.sh <contract-id> [network]
#   contract-id: The deployed contract ID (C...)
#   network: testnet (default) or pubnet

set -e

CONTRACT_ID="${1:?Error: Contract ID (C...) is required}"
NETWORK="${2:-testnet}"

echo "🔗 Generating TypeScript bindings for contract $CONTRACT_ID on $NETWORK..."

cd "$(dirname "$0")/.."

stellar contract bindings typescript \
  --network "$NETWORK" \
  --contract-id "$CONTRACT_ID" \
  --output-dir packages/contract

echo ""
echo "✅ Bindings generated in packages/contract/"
echo ""
echo "Next step:"
echo "  Add to package.json: \"contract\": \"file:packages/contract\""
echo "  Then: npm install"
echo "  Then: import * as contract from 'contract'"
