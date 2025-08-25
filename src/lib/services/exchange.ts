import { clientConfig } from '$lib/config/settings';
import { serverConfig } from '$lib/server/config/settings';
import ccxt, { type OHLCV, Exchange } from 'ccxt';

export class ExchangeService {
    private exchange: Exchange;
    private ohlcvData: { [symbol: string]: OHLCV[] } = {};
    private pollingIntervals: { [symbol: string]: NodeJS.Timeout } = {};

    /**
     * Initializes the ExchangeService by creating a CCXT Bybit exchange instance.
     * The instance is configured with the API key and secret from the server
     * config, and rate limiting is enabled.
     */
    constructor() {
        this.exchange = new ccxt.bybit({
            apiKey: serverConfig.bybit.apiKey,
            secret: serverConfig.bybit.apiSecret,
            enableRateLimit: true,
        });
    }

    /**
     * Initializes the ExchangeService by fetching initial historical OHLCV data and
     * starting polling for each symbol in the given list.
     * @param symbols the list of symbols to initialize
     */
    async initialize(symbols: string[]): Promise<void> {
        for (const symbol of symbols) {
            // Fetch initial historical OHLCV data
            this.ohlcvData[symbol] = await this.exchange.fetchOHLCV(
                symbol,
                clientConfig.timeframe,
                undefined,
                clientConfig.historyLength
            );

            // Start polling for each symbol
            this.startPolling(symbol);
        }
    }

    /**
     * Starts polling for the given symbol at the configured polling interval.
     * @param symbol the symbol to start polling for
     */
    private startPolling(symbol: string): void {
        const interval = setInterval(async () => {
            try {
                const newData = await this.exchange.fetchOHLCV(
                    symbol,
                    clientConfig.timeframe,
                    undefined,
                    clientConfig.historyLength
                );
                this.ohlcvData[symbol] = newData;
                console.log(`[${symbol}] Updated OHLCV, latest close: ${newData[newData.length - 1][4]}`);
            } catch (error) {
                if (error instanceof Error) {
                    console.error(`[${symbol}] Error fetching OHLCV:`, error.message);
                } else {
                    console.error(`[${symbol}] Error fetching OHLCV:`, error);
                }
            }
        }, clientConfig.pollingInterval || 5000); // Default to 5s polling if not set

        this.pollingIntervals[symbol] = interval;
    }


    /**
     * Stops the polling interval for the given symbol.
     * @param symbol the symbol to stop polling for
     */
    stopPolling(symbol: string): void {
        if (this.pollingIntervals[symbol]) {
            clearInterval(this.pollingIntervals[symbol]);
            delete this.pollingIntervals[symbol];
            console.log(`[${symbol}] Polling stopped`);
        }
    }
    /**
     * Stops all polling intervals. Useful for shutting down the service.
     */
    stopAll(): void {
        Object.keys(this.pollingIntervals).forEach((symbol) => this.stopPolling(symbol));
    }

    /**
     * Returns the historical OHLCV data for a given symbol, or an empty array if polling hasn't started yet.
     * @param symbol - The symbol to fetch the OHLCV data for.
     * @returns The historical OHLCV data, or an empty array if polling hasn't started yet.
     */
    getOHLCV(symbol: string): OHLCV[] {
        return this.ohlcvData[symbol] || [];
    }

    /**
     * Returns the latest price for a given symbol, or null if there are no candles yet.
     * @param symbol - The symbol to fetch the latest price for.
     * @returns The latest price, or null if there are no candles yet.
     */
    getLatestPrice(symbol: string): number | null {
        const candles = this.ohlcvData[symbol];
        if (candles && candles.length > 0) {
            const close = candles[candles.length - 1][4];
            return close !== undefined ? Number(close) : null;
        }
        return null;
    }

}
