import prompts, { PromptObject } from 'prompts';
import figlet from 'figlet';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';

import dotenv from "dotenv";
dotenv.config();

interface McpServerConfig {
    command: string;
    args: string[];
    env: Record<string, string>;
    disabled: boolean;
    autoApprove: string[];
}

interface ClaudeDesktopConfig {
    mcpServers: Record<string, McpServerConfig>;
}

type BinanceMcpConfig = Record<"binance-mcp", McpServerConfig>;

// Binance Gold Color
const yellow = chalk.hex('#F0B90B');

// ESModule __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cancel handler
const onCancel = () => {
    console.log(chalk.red('\n❌ Configuration cancelled by user (Ctrl+C or ESC). Exiting...'));
    process.exit(0);
};

// Show Banner
const showBanner = () => {
    const banner = figlet.textSync('Binance MCP ', { font: 'Big' });
    console.log(yellow(banner));
    console.log(yellow('🚀 Welcome to the Binance MCP Configurator\n'));
};

// User Input Types
interface UserInputs {
    BINANCE_API_KEY: string;
    BINANCE_API_SECRET: string;
}

// Ask for credentials
const getInputs = async (): Promise<UserInputs> => {
    const questions: PromptObject[] = [
        {
            type: 'password',
            name: 'BINANCE_API_KEY',
            message: '🔑Enter your BINANCE API KEY:',
            validate: (val: string) => 
            val.trim() === '' ? 'BINANCE API KEY is required!' : true,
        },
        {
            type: 'password',
            name: 'BINANCE_API_SECRET',
            message: ' 🔐 Enter your BINANCE API SECRET:',
            validate: (val: string) =>
                val.trim() === '' ? 'BINANCE API SECRET is required!' : true,
        },
    ];

    return await prompts(questions, { onCancel }) as UserInputs;
};

// Generate .env file
const generateEnvFile = async (BINANCE_API_KEY: string, BINANCE_API_SECRET: string,): Promise<void> => {
    const envContent = `
BINANCE_API_KEY=${BINANCE_API_KEY}
BINANCE_API_SECRET=${BINANCE_API_SECRET}
`.trim();

    await fs.writeFile('.env', envContent);
    console.log(yellow('✅ .env file generated.'));
};

// Generate config object
const generateConfig = async (BINANCE_API_KEY: string, BINANCE_API_SECRET: string,): Promise<BinanceMcpConfig> => {
    const indexPath = path.resolve(__dirname, '..', 'build', 'index.js'); // one level up from cli/

    return {
        'binance-mcp': {
            command: 'node',
            args: [indexPath],
            env: {
                BINANCE_API_KEY: BINANCE_API_KEY,
                BINANCE_API_SECRET: BINANCE_API_SECRET,
            },
            disabled: false,
            autoApprove: []
        }
    };
};

const getClaudeConfigPath = (): string | null => {
    const userHome = os.homedir();
    const platform = os.platform();

    if (platform == "darwin") {
        return path.join(userHome, 'Library/Application Support/Claude/claude_desktop_config.json');
    }

    if (platform == "win32") {
        return path.join(userHome, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
    }

    if (platform == "linux") {
        return path.join(userHome, '.config', 'Claude', 'claude_desktop_config.json');
    }

    return null;
};

const isClaudeDesktopConfig = (value: unknown): value is ClaudeDesktopConfig => {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Partial<ClaudeDesktopConfig>;
    return typeof candidate.mcpServers === "object" && candidate.mcpServers !== null;
};

// Configure Claude Desktop
const configureClaude = async (config: BinanceMcpConfig): Promise<boolean> => {
    const claudePath = getClaudeConfigPath();

    if (!claudePath) {
        console.log(chalk.red('❌ Unsupported platform.'));
        return false;
    }

    await fs.ensureDir(path.dirname(claudePath));
    
    if (!fs.existsSync(claudePath)) {
        console.log(chalk.yellow('⚠️ Claude config file not found. Creating a new one with default configuration.'));
        // Create a default configuration object
        const defaultConfig: ClaudeDesktopConfig = {
            mcpServers: {}
        };
        // Write the default configuration to the file
        await fs.writeJSON(claudePath, defaultConfig, { spaces: 2 });
    }

    
    const jsonData = fs.readFileSync(claudePath, 'utf8');
    const parsedData: unknown = JSON.parse(jsonData);

    if (!isClaudeDesktopConfig(parsedData)) {
        throw new Error('Claude Desktop config must contain an mcpServers object.');
    }
    
    const data: ClaudeDesktopConfig = {
        ...parsedData,
        mcpServers: {
            ...parsedData.mcpServers,
            ...config,
        }
    };
    
    await fs.writeJSON(claudePath, data, { spaces: 2 });
    console.log(yellow('✅ Binance MCP configured for Claude Desktop. Please RESTART your Claude to enjoy it 🎉'));
    return true;
};

// Save fallback config file
const saveFallbackConfig = async (config: BinanceMcpConfig): Promise<void> => {
    await fs.writeJSON('config.json', config, { spaces: 2 });
    console.log(yellow('📁 Saved config.json in root project folder.'));
};

// Main logic
const init = async () => {
    showBanner();

    const { BINANCE_API_KEY, BINANCE_API_SECRET } = await getInputs();


    await generateEnvFile(BINANCE_API_KEY, BINANCE_API_SECRET);

    const config = await generateConfig(BINANCE_API_KEY, BINANCE_API_SECRET);

    const { setupClaude } = await prompts({
        type: 'confirm',
        name: 'setupClaude',
        message: '🧠 Do you want to configure in Claude Desktop?',
        initial: true
    }, { onCancel });

    if (setupClaude) {
        const success = await configureClaude(config);
        if (!success) {
            await saveFallbackConfig(config);
        }
    } else {
        await saveFallbackConfig(config);
    }
};

init(); 
