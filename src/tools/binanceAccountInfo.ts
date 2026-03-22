import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient } from "../config/client.js";

export function registerBinanceAccountInfo(server: McpServer) {
  server.tool(
    "binanceAccountInfo",
    "check binance account info",
    {},
    async ({}) => {
      try {
        const legacySpotClient = spotClient as any;
        const accountInfo = await legacySpotClient.restAPI.getAccount({});
        const accountSnapshot = await legacySpotClient.restAPI.dailyAccountSnapshot({
          type: "SPOT",
          limit: 7,
        });
        const userAssetResponse = await legacySpotClient.restAPI.userAsset({
          needBtcValuation: true,
        });
        const userAsset = await userAssetResponse.data();

        if (userAsset) {
          const balances = userAsset.map((item: any) => ({
            asset: item.asset, free: item.free, locked: item.locked
          }));
          const totalAssetOfBtc = userAsset.reduce(
            (sum: number, item: any) => sum + parseFloat(item.btcValuation || "0"),
            0
          ).toFixed(20).replace(/\.?0+$/, "");
          accountSnapshot.snapshotVos.push({
            type: "spot",
            updateTime: Date.now(),
            data: {
              totalAssetOfBtc,
              balances,
            }
          });
        }
        const btcPrice = await legacySpotClient.restAPI.tickerPrice({ symbol: "BTCUSDT" });
        return {
          content: [
            {
              type: "text",
              text: `Get binance account info successfully. data: ${JSON.stringify(accountInfo)}`,
            },
            {
              type: "text",
              text: `Get binance balance history info successfully. data: ${JSON.stringify(accountSnapshot)}`,
            },
            {
              type: "text",
              text: `Get BTC price successfully. data: ${JSON.stringify(btcPrice)}`,
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
