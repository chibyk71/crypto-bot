import { PUBLIC_SYMBOLS, PUBLIC_TIMEFRAME, PUBLIC_LEVERAGE } from '$env/static/public';

export const clientConfig = {
    symbols: PUBLIC_SYMBOLS.split(','),
    timeframe: PUBLIC_TIMEFRAME,
    leverage: Number(PUBLIC_LEVERAGE)
};
