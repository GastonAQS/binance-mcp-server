import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient } from "../config/binanceClient.js";
import {
    createErrorResponse,
    createTextResponse,
    ensureBinanceAuthConfigured,
    formatBinanceError
} from "./shared/binanceToolUtils.js";

export function registerBinanceSpotPlaceOrder(server: McpServer) {
    server.tool(
        "binanceSpotPlaceOrder",
        "Place a spot market order for smaller trades using either base quantity or quote quantity.",
        {
            symbol: z.string().describe("Trading symbol, for example BTCUSDT"),
            side: z.enum(["BUY", "SELL"]).describe("Order side"),
            quantity: z.number().positive().optional().describe("Amount of the base asset to buy or sell"),
            quoteOrderQty: z
                .number()
                .positive()
                .optional()
                .describe("Amount of quote asset to spend or receive for a MARKET order"),
            newClientOrderId: z.string().optional().describe("Optional client order identifier")
        },
        async ({ symbol, side, quantity, quoteOrderQty, newClientOrderId }) => {
            const authError = ensureBinanceAuthConfigured();
            if (authError) {
                return createErrorResponse(authError);
            }

            if (quantity === undefined && quoteOrderQty === undefined) {
                return createErrorResponse("Either quantity or quoteOrderQty must be provided for a spot market order.");
            }

            if (quantity !== undefined && quoteOrderQty !== undefined) {
                return createErrorResponse("Provide either quantity or quoteOrderQty, not both, for a spot market order.");
            }

            try {
                const request: any = {
                    symbol,
                    side,
                    type: "MARKET"
                };

                if (quantity !== undefined) {
                    request.quantity = quantity;
                }

                if (quoteOrderQty !== undefined) {
                    request.quoteOrderQty = quoteOrderQty;
                }

                if (newClientOrderId) {
                    request.newClientOrderId = newClientOrderId;
                }

                const response = await spotClient.restAPI.newOrder(request);
                const result = await response.data();

                return createTextResponse(
                    `Placed Binance spot market order successfully for ${symbol}. Order id: ${
                        result.orderId ?? "unknown"
                    }. Response: ${JSON.stringify(result)}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to place Binance spot market order: ${formatBinanceError(error)}`);
            }
        }
    );
}
