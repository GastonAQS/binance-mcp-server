import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient } from "../config/client.js";

export function registerBinanceOrderBook(server: McpServer) {
  server.tool(
    "binanceOrderBook",
    "check binance order book",
    {
        symbol: z.string().describe("symbol: exemple: BTCUSDT"),
    },
    async ({ symbol }) => {
      try {
        const legacySpotClient = spotClient as any;
        const response = await legacySpotClient.restAPI.depth({ symbol, limit: 50 });
        const orderBook = await response.data();

        return {
          content: [
            {
              type: "text",
              text: `Get binance order book successfully. data: ${JSON.stringify(orderBook)}}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            { type: "text", text: `Server failed: ${errorMessage}` },
          ],
          isError: true,
        };
      }
    }
  );
}
