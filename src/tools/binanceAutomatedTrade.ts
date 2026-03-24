import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { algoClient, spotClient } from "../config/binanceClient.js";
import {
    createErrorResponse,
    createTextResponse,
    ensureBinanceAuthConfigured,
    formatBinanceError
} from "./shared/binanceToolUtils.js";

export function registerBinanceAutomatedTrade(server: McpServer) {
    server.tool(
        "binanceAutomatedTrade",
        "Execute a predefined trading strategy that chooses a spot market order or a spot TWAP order based on estimated notional.",
        {
            symbol: z.string().describe("Trading symbol, for example BTCUSDT"),
            side: z.enum(["BUY", "SELL"]).describe("Order side"),
            quantity: z.number().positive().describe("Base asset quantity to trade"),
            strategy: z
                .enum(["MARKET", "ADAPTIVE_SPOT_TWAP"])
                .optional()
                .describe("MARKET executes immediately. ADAPTIVE_SPOT_TWAP switches to spot TWAP above a threshold."),
            notionalThresholdUsd: z
                .number()
                .positive()
                .optional()
                .describe("Threshold used by ADAPTIVE_SPOT_TWAP. Defaults to 1000."),
            duration: z
                .number()
                .int()
                .min(300)
                .max(86400)
                .optional()
                .describe("Spot TWAP duration in seconds. Defaults to 3600 when TWAP is selected."),
            clientAlgoId: z.string().length(32).optional().describe("Optional spot TWAP client algo identifier"),
            limitPrice: z.number().positive().optional().describe("Optional spot TWAP limit price"),
            newClientOrderId: z.string().optional().describe("Optional spot market order identifier")
        },
        async ({ symbol, side, quantity, strategy, notionalThresholdUsd, duration, clientAlgoId, limitPrice, newClientOrderId }) => {
            const authError = ensureBinanceAuthConfigured();
            if (authError) {
                return createErrorResponse(authError);
            }

            try {
                const priceResponse = await spotClient.restAPI.tickerPrice({ symbol });
                const priceData = await priceResponse.data();
                const referencePrice = Number(priceData.price);

                if (!Number.isFinite(referencePrice) || referencePrice <= 0) {
                    return createErrorResponse(`Unable to derive a valid reference price for ${symbol}.`);
                }

                const threshold = notionalThresholdUsd ?? 1000;
                const estimatedNotional = referencePrice * quantity;
                const resolvedStrategy =
                    strategy === "MARKET"
                        ? "MARKET"
                        : estimatedNotional >= threshold
                          ? "SPOT_TWAP"
                          : "MARKET";

                if (resolvedStrategy === "MARKET") {
                    const marketOrderRequest: any = {
                        symbol,
                        side,
                        type: "MARKET",
                        quantity
                    };

                    if (newClientOrderId) {
                        marketOrderRequest.newClientOrderId = newClientOrderId;
                    }

                    const marketOrderResponse = await spotClient.restAPI.newOrder(marketOrderRequest);
                    const marketOrder = await marketOrderResponse.data();

                    return createTextResponse(
                        `Executed automated trade using MARKET strategy for ${symbol}. Estimated notional: ${estimatedNotional.toFixed(
                            2
                        )} USDT. Response: ${JSON.stringify(marketOrder)}`
                    );
                }

                const twapOrderResponse = await algoClient.restAPI.timeWeightedAveragePriceSpotAlgo({
                    symbol,
                    side,
                    quantity,
                    duration: duration ?? 3600,
                    ...(clientAlgoId && { clientAlgoId }),
                    ...(limitPrice !== undefined && { limitPrice })
                });
                const twapOrder = await twapOrderResponse.data();

                return createTextResponse(
                    `Executed automated trade using SPOT_TWAP strategy for ${symbol}. Estimated notional: ${estimatedNotional.toFixed(
                        2
                    )} USDT. Response: ${JSON.stringify(twapOrder)}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to execute automated Binance trade: ${formatBinanceError(error)}`);
            }
        }
    );
}
