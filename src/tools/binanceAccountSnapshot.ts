import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient, walletClient } from "../config/binanceClient.js";
import {
    createErrorResponse,
    createTextResponse,
    ensureBinanceAuthConfigured,
    formatBinanceError
} from "./shared/binanceToolUtils.js";

export function registerBinanceAccountSnapshot(server: McpServer) {
    server.tool(
        "binanceAccountSnapshot",
        "Retrieve a daily account snapshot and current BTCUSDT reference price.",
        {
            type: z
                .enum(["SPOT", "MARGIN", "FUTURES"])
                .optional()
                .describe("Account type. Defaults to SPOT."),
            limit: z.number().int().min(1).max(30).optional().describe("Number of snapshot points to return"),
            recvWindow: z.number().optional().describe("Optional receive window in milliseconds")
        },
        async ({ type, limit, recvWindow }) => {
            const authError = ensureBinanceAuthConfigured();
            if (authError) {
                return createErrorResponse(authError);
            }

            try {
                const snapshotParams = {
                    type: type ?? "SPOT",
                    ...(limit !== undefined && { limit }),
                    ...(recvWindow !== undefined && { recvWindow })
                };

                const [snapshotResponse, btcPriceResponse] = await Promise.all([
                    walletClient.restAPI.dailyAccountSnapshot(snapshotParams),
                    spotClient.restAPI.tickerPrice({ symbol: "BTCUSDT" })
                ]);

                const [snapshot, btcPrice] = await Promise.all([snapshotResponse.data(), btcPriceResponse.data()]);

                return createTextResponse(
                    `Retrieved ${snapshotParams.type} account snapshot successfully. Snapshot points: ${
                        snapshot.snapshotVos?.length ?? 0
                    }. Current BTCUSDT price: ${btcPrice.price ?? "unknown"}. Response: ${JSON.stringify({
                        snapshot,
                        btcPrice
                    })}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to retrieve Binance account snapshot: ${formatBinanceError(error)}`);
            }
        }
    );
}
