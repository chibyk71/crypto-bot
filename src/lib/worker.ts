import cron from 'node-cron';
import { ExchangeService } from './services/exchange';
import { Strategy } from './strategy';
import { dbService } from '$lib/server/db';
import { clientConfig } from './config/settings';
import { TelegramService } from './services/telegram';

export async function startWorker(): Promise<void> {
    const exchange = new ExchangeService();
    const strategy = new Strategy(3);
    const telegram = new TelegramService();

    await exchange.initialize(clientConfig.symbols);
    console.log(`[Worker] Exchange initialized for:`, clientConfig.symbols);

    cron.schedule('*/5 * * * *', async () => {
        const scanStart = new Date();
        console.log(`[Worker] Scan started at ${scanStart.toISOString()}`);

        try {
            for (const symbol of clientConfig.symbols) {
                const ohlcv = exchange.getOHLCV(symbol);
                if (!ohlcv || ohlcv.length < 50) continue;

                const highs = ohlcv.map(c => Number(c[2]));
                const lows = ohlcv.map(c => Number(c[3]));
                const closes = ohlcv.map(c => Number(c[4]));
                const volumes = ohlcv.map(c => Number(c[5]));
                const price = closes.at(-1)!;

                const signal = strategy.generateSignal({
                    symbol,
                    highs,
                    lows,
                    closes,
                    volumes,
                });

                // Fetch active alerts for this symbol
                const alerts = await dbService.getAlertsBySymbol(symbol);

                for (const alert of alerts) {
                    let triggered = false;
                    let triggerReason = '';

                    // Example: match alert condition to signal
                    if (
                        (alert.condition === 'price >' && price > alert.targetPrice) ||
                        (alert.condition === 'price <' && price < alert.targetPrice) ||
                        (alert.condition === 'crosses_above_ema200' && signal.reason.some(r => r.includes('Golden Cross'))) ||
                        (alert.condition === 'crosses_below_ema200' && signal.reason.some(r => r.includes('Death Cross')))
                    ) {
                        triggered = true;
                        triggerReason = alert.condition;
                    }

                    if (triggered) {
                        await dbService.updateAlertStatus(alert.id, 'triggered');
                        const msg = [
                            `🔔 Alert Triggered: ${symbol}`,
                            `• Condition: ${triggerReason}`,
                            `• Signal: ${signal.signal.toUpperCase()}`,
                            `• Price: $${price}`,
                            `• Indicators: ${signal.reason.join(', ')}`,
                            `• ROI Est: ${strategy.lastAtr ? ((3 * strategy.lastAtr / price) * 100).toFixed(2) + '%' : 'N/A'}`,
                            alert.note ? `• Note: ${alert.note}` : ''
                        ].filter(Boolean).join('\n');
                        await telegram.sendMessage(msg);
                    }
                }
            }
        } catch (err) {
            console.error('[Worker] Error during scan:', err);
        }

        const scanEnd = new Date();
        console.log(`[Worker] Scan finished at ${scanEnd.toISOString()}`);
    });

    console.log('[Worker] Started. Monitoring:', clientConfig.symbols);
}
