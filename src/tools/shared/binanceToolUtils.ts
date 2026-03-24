import {
    configuredBinanceAuthMode,
    isBinanceAuthConfigured
} from "../../config/binanceClient.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}

function valueToString(value: unknown): string | null {
    if (typeof value === "string") {
        return value.trim() || null;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    return null;
}

function extractStatusCode(error: unknown): string | null {
    if (!isRecord(error)) {
        return null;
    }

    const directStatus = valueToString(error.statusCode) ?? valueToString(error.status);
    if (directStatus) {
        return directStatus;
    }

    if (isRecord(error.response)) {
        return valueToString(error.response.status) ?? valueToString(error.response.statusCode);
    }

    return null;
}

function extractErrorCode(error: unknown): string | null {
    if (!isRecord(error)) {
        return null;
    }

    return valueToString(error.code) ?? valueToString(error.errorCode);
}

function extractPayload(error: unknown): string | null {
    if (!isRecord(error)) {
        return null;
    }

    const candidates = [error.body, error.data, error.response];

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        if (typeof candidate === "string") {
            return candidate;
        }

        try {
            return JSON.stringify(candidate);
        } catch {
            continue;
        }
    }

    return null;
}

export function getBinanceAuthHelpText(): string {
    if (configuredBinanceAuthMode === "key-pair") {
        return "Configured for key-pair authentication via BINANCE_API_KEY and BINANCE_PRIVATE_KEY.";
    }

    if (configuredBinanceAuthMode === "hmac") {
        return "Configured for HMAC authentication via BINANCE_API_KEY and BINANCE_API_SECRET.";
    }

    return "Set BINANCE_API_KEY together with BINANCE_API_SECRET, or set BINANCE_API_KEY together with BINANCE_PRIVATE_KEY.";
}

export function ensureBinanceAuthConfigured(): string | null {
    if (isBinanceAuthConfigured) {
        return null;
    }

    return `Binance authentication is not configured. ${getBinanceAuthHelpText()}`;
}

export function formatBinanceError(error: unknown): string {
    if (error instanceof Error && error.message.trim()) {
        const details: string[] = [error.message.trim()];
        const statusCode = extractStatusCode(error);
        const errorCode = extractErrorCode(error);
        const payload = extractPayload(error);

        if (statusCode) {
            details.push(`status=${statusCode}`);
        }

        if (errorCode) {
            details.push(`code=${errorCode}`);
        }

        if (payload && !details.some((part) => payload.includes(part))) {
            details.push(`payload=${payload}`);
        }

        return details.join(" | ");
    }

    if (isRecord(error)) {
        const statusCode = extractStatusCode(error);
        const errorCode = extractErrorCode(error);
        const payload = extractPayload(error);
        const details = [statusCode ? `status=${statusCode}` : null, errorCode ? `code=${errorCode}` : null, payload]
            .filter((value): value is string => Boolean(value));

        if (details.length > 0) {
            return details.join(" | ");
        }
    }

    return String(error);
}

export function createTextResponse(text: string) {
    return {
        content: [
            {
                type: "text" as const,
                text
            }
        ]
    };
}

export function createErrorResponse(text: string) {
    return {
        content: [
            {
                type: "text" as const,
                text
            }
        ],
        isError: true
    };
}
