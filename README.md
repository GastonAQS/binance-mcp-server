# Binance MCP Server

Binance MCP Server is a TypeScript Model Context Protocol server that exposes Binance API capabilities over stdio. It can be launched directly by Claude Desktop or any MCP client that supports stdio-based servers.

The server includes both:

- A broad domain-based tool surface for Spot, Algo, Convert, Wallet, Simple Earn, Staking, Mining, VIP Loan, NFT, Pay, Fiat, Rebate, C2C, Copy Trading, and Dual Investment APIs
- A small set of README-friendly compatibility tools for common account, order book, spot order, TWAP, and automated-trading flows

## Features

- [x] Binance API integration over MCP stdio
- [x] Spot market data, account, order, and user data stream tools
- [x] Convert, Wallet, Simple Earn, Staking, Mining, VIP Loan, NFT, Pay, Fiat, Rebate, C2C, Copy Trading, and Dual Investment tool groups
- [x] Portfolio/account summary via `binanceAccountInfo`
- [x] Historical account snapshots via `binanceAccountSnapshot`
- [x] Spot market order execution via `binanceSpotPlaceOrder`
- [x] Algorithmic trading support with spot and futures TWAP tools
- [x] Automated trading strategy selection via `binanceAutomatedTrade`
- [x] Secure authentication with HMAC API secret or optional RSA/ED25519 private key configuration
- [x] Structured error responses for MCP tool failures
- [x] Docker and Claude Desktop integration guidance

## Requirements

Before setting up the server, install:

- Node.js 22.12.0 or later
- npm
- Binance API credentials

Supported authentication modes:

1. HMAC:
   - `BINANCE_API_KEY`
   - `BINANCE_API_SECRET`
2. Key pair:
   - `BINANCE_API_KEY`
   - `BINANCE_PRIVATE_KEY`
   - Optional: `BINANCE_PRIVATE_KEY_PASSPHRASE`
   - Optional: `BINANCE_PRIVATE_KEY_ALGO` with `RSA` or `ED25519`

## Installation

```sh
git clone https://github.com/your-repo/binance-mcp-server.git
cd binance-mcp-server
npm install
```

Build the server:

```sh
npm run build
```

Run the server locally:

```sh
npm start
```

Run the built executable directly:

```sh
./build/index.js
```

Run the interactive setup flow:

```sh
npm run init:build
```

## Configuration

### HMAC Authentication

Create a `.env` file in the project root:

```sh
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_API_SECRET=your_binance_api_secret_here
```

### Key-Pair Authentication

If you use a self-managed RSA or ED25519 Binance API key, configure:

```sh
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
BINANCE_PRIVATE_KEY_PASSPHRASE=optional_passphrase
BINANCE_PRIVATE_KEY_ALGO=RSA
```

`BINANCE_PRIVATE_KEY` may be provided with literal newlines or `\n` escapes.

## Creating a Binance API Key

Binance changes account-policy and API-key prerequisites over time, so treat the Binance UI and official docs as the source of truth for the exact steps and requirements.

A typical flow is:

1. Sign in to Binance and open **Account**.
   ![Binance Homepage](readme/homepage.png)
2. Open **API Management** and create an API key.
   ![API Management](readme/API%20Management.png)
3. Choose the API key type supported by your setup.
   ![API Key Type](readme/API%20Key%20Type.png)
4. Name the key and complete Binance verification.
   ![Create API key](readme/Create%20API%20key.png)
5. Review the resulting security and permission settings.
   ![Security Management](readme/Security%20Management.png)

Official Binance docs:

- General developer docs: https://developers.binance.com/en/
- Spot API docs: https://developers.binance.com/docs/binance-spot-api-docs/README
- Algo API docs: https://developers.binance.com/docs/algo

## Tool Surface

### Compatibility Shortcut Tools

These are registered explicitly for common workflows and match the README examples.

1. `binanceAccountInfo`
   - Retrieves account balances, API-key permissions, a BTC-valued asset summary, and recent spot snapshot information.
2. `binanceAccountSnapshot`
   - Retrieves daily account snapshots for `SPOT`, `MARGIN`, or `FUTURES` and includes the current `BTCUSDT` reference price.
3. `binanceOrderBook`
   - Retrieves order book depth for a symbol.
4. `binanceSpotPlaceOrder`
   - Places a spot `MARKET` order using either `quantity` or `quoteOrderQty`.
5. `binanceTimeWeightedAveragePriceFutureAlgo`
   - Places a Binance Algo futures TWAP order.
6. `binanceAutomatedTrade`
   - Uses a predefined strategy to choose between a spot market order and a spot TWAP order based on estimated notional.

Example payloads:

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 0.001
}
```

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 1,
  "duration": 3600
}
```

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 0.5,
  "strategy": "ADAPTIVE_SPOT_TWAP",
  "notionalThresholdUsd": 1000,
  "duration": 1800
}
```

### Domain-Based Tool Groups

The full server surface is larger than the compatibility shortcuts above. The entrypoint registers:

- Spot
- Algo
- Simple Earn
- C2C
- Convert
- Wallet
- Copy Trading
- Fiat
- NFT
- Pay
- Rebate
- Dual Investment
- Mining
- VIP Loan
- Staking

Representative tool names include:

- `BinanceGetAccount`
- `BinanceDepth`
- `BinanceNewOrder`
- `BinanceSpotTimeWeightedAveragePriceNewOrder`
- `BinanceTimeWeightedAveragePriceNewOrder`
- `BinanceConvertSendQuoteRequest`
- `BinanceWalletUserAsset`

## Claude Desktop Integration

Build the server first:

```sh
npm run build
```

Then add it to your Claude Desktop configuration file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Example:

```json
{
  "mcpServers": {
    "binance-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/binance-mcp-server/build/index.js"
      ],
      "env": {
        "BINANCE_API_KEY": "your_binance_api_key_here",
        "BINANCE_API_SECRET": "your_binance_api_secret_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

If you prefer the interactive setup flow, run `npm run init:build`. It can generate `.env` and write Claude Desktop config on macOS, Windows, and Linux. If auto-configuration is not possible, it writes a local `config.json` fallback.

## Docker

Build the image:

```sh
docker build -t binance-mcp-server .
```

Run the MCP server over stdio:

```sh
docker run -i --rm \
  -e BINANCE_API_KEY=your_binance_api_key_here \
  -e BINANCE_API_SECRET=your_binance_api_secret_here \
  binance-mcp-server
```

The `-i` flag is required so the MCP client can communicate with the server over standard input/output.

For Docker-based MCP clients:

```json
{
  "mcpServers": {
    "binance-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "BINANCE_API_KEY",
        "-e",
        "BINANCE_API_SECRET",
        "binance-mcp-server"
      ],
      "env": {
        "BINANCE_API_KEY": "your_binance_api_key_here",
        "BINANCE_API_SECRET": "your_binance_api_secret_here"
      }
    }
  }
}
```

If your client does not project `env` values into the Docker process, replace the bare `-e` entries with explicit `KEY=value` pairs.

## Validation

Recommended local validation steps:

```sh
npm run build
BINANCE_API_KEY=dummy BINANCE_API_SECRET=dummy ./build/index.js
```

`npm test` is declared in `package.json`, but the repository snapshot does not currently include `test/testServer.js`, so that script should be treated as unavailable until the missing test file is restored.

## Error Handling

Tool failures are returned as MCP text responses with `isError: true`. Common categories include:

- Missing or invalid Binance credentials
- Permission or account-configuration errors
- Order validation errors
- Rate limits and server-side Binance API failures
- Network or transport failures

## Model Context Protocol

MCP is the protocol used by clients such as Claude Desktop to launch tools and exchange structured requests and responses with this server. This repository exposes Binance functionality as MCP tools over stdio.
