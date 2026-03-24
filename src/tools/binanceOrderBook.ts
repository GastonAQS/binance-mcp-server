import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient } from "../config/binanceClient.js";
import { createErrorResponse, createTextResponse, formatBinanceError } from "./shared/binanceToolUtils.js";

export function registerBinanceOrderBook(server: McpServer) {
    server.tool(
        "binanceOrderBook",
        "Retrieve the current Binance order book for a trading pair.",
        {
            symbol: z.string().describe("Trading symbol, for example BTCUSDT"),
            limit: z.number().int().min(1).max(5000).optional().describe("Depth levels to request. Defaults to 50.")
        },
        async ({ symbol, limit }) => {
            try {
                const response = await spotClient.restAPI.depth({
                    symbol,
                    limit: limit ?? 50
                });
                const orderBook = await response.data();
                const bestBid = Array.isArray(orderBook.bids) ? orderBook.bids[0] : undefined;
                const bestAsk = Array.isArray(orderBook.asks) ? orderBook.asks[0] : undefined;

                return createTextResponse(
                    `Retrieved Binance order book successfully for ${symbol}. Best bid: ${
                        bestBid ? `${bestBid[0]} x ${bestBid[1]}` : "unavailable"
                    }. Best ask: ${bestAsk ? `${bestAsk[0]} x ${bestAsk[1]}` : "unavailable"}. Response: ${JSON.stringify(
                        orderBook
                    )}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to retrieve Binance order book: ${formatBinanceError(error)}`);
            }
        }
    );
}
