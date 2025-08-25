import { describe, it, expect } from 'vitest';
import { ExchangeService } from '../src/lib/services/exchange';
import { TelegramService } from '../src/lib/services/telegram';
import { clientConfig } from '../src/lib/config/settings';

describe('Exchange + Telegram Integration', () => {
    it('fetches latest price and sends a Telegram message', async () => {
        const exchange = new ExchangeService();
        await exchange.initialize(clientConfig.symbols);

        const latestPrice = exchange.getLatestPrice('BTCUSDT');
        console.log('BTCUSDT latest price:', latestPrice);

        expect(latestPrice).not.toBeNull();

        const telegram = new TelegramService();
        await telegram.sendMessage(`Test alert from crypto bot! Latest BTCUSDT price: ${latestPrice}`);
    });
});
