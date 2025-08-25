import { env } from '$env/dynamic/private';

export const serverConfig = {
    bybit: {
        apiKey: env.BYBIT_API_KEY ?? '',
        apiSecret: env.BYBIT_API_SECRET ?? '',
    },
    telegram: {
        token: env.TELEGRAM_BOT_TOKEN ?? '',
        chatId: env.TELEGRAM_CHAT_ID ?? '',
    },
    dbPath: env.DB_PATH ?? './alerts.db'
};
