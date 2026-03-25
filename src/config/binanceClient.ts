// src/config/binanceClient.ts
import { Spot } from "@binance/spot";
import { SimpleEarn } from "@binance/simple-earn";
import { Algo } from "@binance/algo";
import { C2C } from "@binance/c2c";
import { Convert } from "@binance/convert";
import { Wallet } from "@binance/wallet";
import { CopyTrading } from "@binance/copy-trading";
import { Fiat } from "@binance/fiat";
import { NFT } from "@binance/nft";
import { Pay } from "@binance/pay";
import { Rebate } from "@binance/rebate";
import { DualInvestment } from "@binance/dual-investment";
import { Mining } from "@binance/mining";
import { VipLoan } from "@binance/vip-loan";
import { Staking } from "@binance/staking";

type BinanceAuthMode = "hmac" | "key-pair" | "missing";

type BinanceRestConfiguration = {
    apiKey: string;
    apiSecret?: string;
    privateKey?: Buffer;
    privateKeyPassphrase?: string;
    privateKeyAlgo?: "RSA" | "ED25519";
    basePath: string;
};

const API_KEY = process.env.BINANCE_API_KEY?.trim();
const API_SECRET = process.env.BINANCE_API_SECRET?.trim();
const PRIVATE_KEY = process.env.BINANCE_PRIVATE_KEY?.replace(/\\n/g, "\n")?.trim();
const PRIVATE_KEY_PASSPHRASE = process.env.BINANCE_PRIVATE_KEY_PASSPHRASE;
const PRIVATE_KEY_ALGO = process.env.BINANCE_PRIVATE_KEY_ALGO?.trim().toUpperCase();
const BASE_URL = process.env.BINANCE_BASE_URL?.trim() || "https://api.binance.com";

const configurationRestAPI: BinanceRestConfiguration = {
    apiKey: API_KEY ?? "",
    basePath: BASE_URL ?? ""
};

if (PRIVATE_KEY) {
    configurationRestAPI.privateKey = Buffer.from(PRIVATE_KEY, "utf8");

    if (PRIVATE_KEY_PASSPHRASE) {
        configurationRestAPI.privateKeyPassphrase = PRIVATE_KEY_PASSPHRASE;
    }

    if (PRIVATE_KEY_ALGO === "RSA" || PRIVATE_KEY_ALGO === "ED25519") {
        configurationRestAPI.privateKeyAlgo = PRIVATE_KEY_ALGO;
    }
} else {
    configurationRestAPI.apiSecret = API_SECRET ?? "";
}

export const isHmacAuthConfigured = Boolean(API_KEY && API_SECRET);
export const isKeyPairAuthConfigured = Boolean(API_KEY && PRIVATE_KEY);
export const isBinanceAuthConfigured = isHmacAuthConfigured || isKeyPairAuthConfigured;
export const configuredBinanceAuthMode: BinanceAuthMode = isKeyPairAuthConfigured
    ? "key-pair"
    : isHmacAuthConfigured
      ? "hmac"
      : "missing";

export const spotClient = new Spot({ configurationRestAPI });
export const algoClient = new Algo({ configurationRestAPI });
export const simpleEarnClient = new SimpleEarn({ configurationRestAPI });
export const c2cClient = new C2C({ configurationRestAPI });
export const convertClient = new Convert({ configurationRestAPI });
export const walletClient = new Wallet({ configurationRestAPI });
export const copyTradingClient = new CopyTrading({ configurationRestAPI });
export const fiatClient = new Fiat({ configurationRestAPI });
export const nftClient = new NFT({ configurationRestAPI });
export const payClient = new Pay({ configurationRestAPI });
export const rebateClient = new Rebate({ configurationRestAPI });
export const dualInvestmentClient = new DualInvestment({ configurationRestAPI });
export const miningClient = new Mining({ configurationRestAPI });
export const vipLoanClient = new VipLoan({ configurationRestAPI });
export const stakingClient = new Staking({ configurationRestAPI });
