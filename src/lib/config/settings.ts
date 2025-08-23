import dotenv from 'dotenv';
dotenv.config();

export const config = {
    bybit: {
        apiKey: process.env.BYBIT_API_KEY || '',
        apiSecret: process.env.BYBIT_API_SECRET || '',
    },
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
    },
    symbols: (process.env.SYMBOLS || 'BTCUSDT,ETHUSDT').split(','),
    timeframe: process.env.TIMEFRAME || '1m',
    historyLength: process.env.HISTORY_LENGTH || 100,
    pollInterval: parseInt(process.env.POLL_INTERVAL || '60000', 10), // in ms
    leverage: parseInt(process.env.LEVERAGE || '1', 10),
    dbPath: process.env.DB_PATH || './alerts.db',
};