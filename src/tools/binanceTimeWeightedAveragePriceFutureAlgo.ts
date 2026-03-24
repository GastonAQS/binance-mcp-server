import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { algoClient } from "../config/binanceClient.js";
import {
    createErrorResponse,
    createTextResponse,
    ensureBinanceAuthConfigured,
    formatBinanceError
} from "./shared/binanceToolUtils.js";

export function registerBinanceTimeWeightedAveragePriceFutureAlgo(server: McpServer) {
    server.tool(
        "binanceTimeWeightedAveragePriceFutureAlgo",
        "Place a futures TWAP order on Binance Algo for larger orders that should execute gradually.",
        {
            symbol: z.string().describe("Trading symbol, for example BTCUSDT"),
            side: z.enum(["BUY", "SELL"]).describe("Order side"),
            positionSide: z
                .enum(["BOTH", "LONG", "SHORT"])
                .optional()
                .describe("Default BOTH for one-way mode; LONG or SHORT for hedge mode"),
            quantity: z
                .number()
                .positive()
                .describe("Base asset quantity. Futures notional must satisfy Binance Algo limits."),
            duration: z.number().int().min(300).max(86400).describe("TWAP duration in seconds"),
            clientAlgoId: z.string().length(32).optional().describe("Optional 32-character algo order identifier"),
            reduceOnly: z.boolean().optional().describe("Whether this order is reduce-only"),
            limitPrice: z.number().positive().optional().describe("Optional limit price"),
            recvWindow: z.number().optional().describe("Optional receive window in milliseconds")
        },
        async ({ symbol, side, positionSide, quantity, duration, clientAlgoId, reduceOnly, limitPrice, recvWindow }) => {
            const authError = ensureBinanceAuthConfigured();
            if (authError) {
                return createErrorResponse(authError);
            }

            try {
                const response = await algoClient.restAPI.timeWeightedAveragePriceFutureAlgo({
                    symbol,
                    side,
                    quantity,
                    duration,
                    ...(positionSide && { positionSide }),
                    ...(clientAlgoId && { clientAlgoId }),
                    ...(reduceOnly !== undefined && { reduceOnly }),
                    ...(limitPrice !== undefined && { limitPrice }),
                    ...(recvWindow !== undefined && { recvWindow })
                });
                const result = await response.data();

                return createTextResponse(
                    `Placed Binance futures TWAP order successfully for ${symbol}. Response: ${JSON.stringify(result)}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to place Binance futures TWAP order: ${formatBinanceError(error)}`);
            }
        }
    );
}
