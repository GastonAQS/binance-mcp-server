# AGENTS.md

## Purpose

This repository contains a TypeScript Model Context Protocol server that exposes Binance API capabilities as MCP tools over stdio.

## Stack

- Node.js
- TypeScript with `strict` mode
- `@modelcontextprotocol/sdk`
- Binance SDK packages under `@binance/*`
- `dotenv`, `prompts`, `chalk`, `figlet`, `ora`, `fs-extra`

## Project Layout

- `src/index.ts`: main MCP server entrypoint. Creates the server, registers tool groups, and connects stdio transport.
- `src/init.ts`: interactive setup flow for generating local config and env wiring.
- `src/config/`: shared configuration and Binance client instances.
- `src/tools/`: MCP tool registration grouped by Binance product/domain.
- `readme/`: images referenced by `README.md`.

Tool modules follow a consistent pattern:

1. Domain `index.ts` files register sub-groups.
2. Leaf files export one `register...` function.
3. Each leaf registers a tool with `server.tool(...)`, validates inputs with `zod`, calls a Binance SDK client, and returns MCP text content.

## Commands

- Install dependencies: `npm install`
- Build: `npm run build`
- Run setup: `npm run init`
- Build and run setup: `npm run init:build`
- Run the built server: `node build/index.js`
- Test: `npm test`

## Conventions

- Use ESM imports and keep `.js` suffixes in TypeScript import specifiers.
- Match the existing formatting style: 4-space indentation, double quotes, semicolons.
- Keep files small and focused; prefer one exported registration function per leaf module.
- Reuse shared clients from `src/config/binanceClient.ts` instead of creating ad hoc client instances.
- When adding a tool, wire it through the nearest domain `index.ts` so it becomes reachable from `src/index.ts`.
- Keep error handling consistent with existing tools: catch errors and return MCP text content with `isError: true`.

## Validation

Before closing work, run `npm run build`.

If you touch setup flows, also verify `npm run init` or `npm run init:build`.

`npm test` is declared in `package.json`, but it currently points to `test/testServer.js`, which is not present in this repository snapshot. Treat that script as unavailable until the missing test file is restored.

## Environment

The server expects:

- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`

These are consumed by `src/config/binanceClient.ts` and passed to the Binance SDK client configuration.
