import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { spotClient, walletClient } from "../config/binanceClient.js";
import {
    createErrorResponse,
    createTextResponse,
    ensureBinanceAuthConfigured,
    formatBinanceError
} from "./shared/binanceToolUtils.js";

export function registerBinanceAccountInfo(server: McpServer) {
    server.tool(
        "binanceAccountInfo",
        "Retrieve account balances, permissions, and a BTC-valued portfolio summary.",
        {
            recvWindow: z.number().optional().describe("Optional receive window in milliseconds")
        },
        async ({ recvWindow }) => {
            const authError = ensureBinanceAuthConfigured();
            if (authError) {
                return createErrorResponse(authError);
            }

            try {
                const params = recvWindow !== undefined ? { recvWindow } : {};
                const [accountResponse, snapshotResponse, assetResponse, permissionResponse] = await Promise.all([
                    spotClient.restAPI.getAccount(params),
                    walletClient.restAPI.dailyAccountSnapshot({ type: "SPOT", limit: 7, ...params }),
                    walletClient.restAPI.userAsset({ needBtcValuation: true, ...params }),
                    walletClient.restAPI.getApiKeyPermission(params)
                ]);

                const [account, snapshot, assets, permissions] = await Promise.all([
                    accountResponse.data(),
                    snapshotResponse.data(),
                    assetResponse.data(),
                    permissionResponse.data()
                ]);

                const nonZeroAssets = Array.isArray(assets)
                    ? assets
                          .filter((asset) => {
                              const free = Number(asset.free ?? 0);
                              const locked = Number(asset.locked ?? 0);
                              return Number.isFinite(free + locked) && free + locked > 0;
                          })
                          .map((asset) => ({
                              asset: asset.asset,
                              free: asset.free,
                              locked: asset.locked,
                              btcValuation: asset.btcValuation
                          }))
                    : [];

                const totalAssetOfBtc = nonZeroAssets
                    .reduce((sum, asset) => sum + Number(asset.btcValuation ?? 0), 0)
                    .toFixed(8);

                const topHoldings = [...nonZeroAssets]
                    .sort((left, right) => Number(right.btcValuation ?? 0) - Number(left.btcValuation ?? 0))
                    .slice(0, 5)
                    .map((asset) => `${asset.asset}:${asset.btcValuation ?? "0"} BTC`)
                    .join(", ");

                return createTextResponse(
                    `Retrieved Binance account information successfully. Trading enabled: ${
                        account.canTrade ?? "unknown"
                    }. Non-zero assets: ${nonZeroAssets.length}. Total BTC valuation: ${totalAssetOfBtc}. Top holdings: ${
                        topHoldings || "none"
                    }. API permissions: ${JSON.stringify(permissions)}. Snapshot points returned: ${
                        snapshot.snapshotVos?.length ?? 0
                    }. Response: ${JSON.stringify({
                        account,
                        permissions,
                        snapshot,
                        assets: nonZeroAssets
                    })}`
                );
            } catch (error) {
                return createErrorResponse(`Failed to retrieve Binance account information: ${formatBinanceError(error)}`);
            }
        }
    );
}
