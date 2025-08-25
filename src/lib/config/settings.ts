import { PUBLIC_SYMBOLS, PUBLIC_TIMEFRAME, PUBLIC_LEVERAGE, PUBLIC_POLL_INTERVAL } from '$env/static/public';

export const clientConfig = {
    symbols: PUBLIC_SYMBOLS.split(','),
    timeframe: PUBLIC_TIMEFRAME,
    leverage: Number(PUBLIC_LEVERAGE),
    historyLength: 100, // Number of historical candles to fetch
    pollingInterval: Number(PUBLIC_POLL_INTERVAL) || 300000, // Default to 5 minutes
};
