import cron from 'node-cron';
import { ExchangeService } from './services/exchange';
import { Strategy } from './strategy';
import { dbService } from '$lib/server/db';
import { clientConfig } from './config/settings';
import { TelegramService } from './services/telegram';
import * as fs from 'fs/promises';
import { createLogger, format, transports } from 'winston';

// Initialize structured logging
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: 'logs/worker.log' }),
        new transports.Console()
    ]
});

const LOCK_FILE = './worker.lock';
let isRunning = false;

/**
 * Acquires a lock to prevent overlapping cron jobs.
 * @returns {Promise<boolean>} True if the lock was acquired, false if already locked.
 */
async function acquireLock(): Promise<boolean> {
    try {
        await fs.writeFile(LOCK_FILE, process.pid.toString(), { flag: 'wx' });
        return true;
    } catch (err) {
        logger.warn('Failed to acquire lock, another scan may be running');
        return false;
    }
}

/**
 * Releases the lock file.
 */
async function releaseLock(): Promise<void> {
    try {
        await fs.unlink(LOCK_FILE);
    } catch (err) {
        logger.warn('Failed to release lock:', err);
    }
}

/**
 * Starts the worker which runs every 5 minutes, checks the current price and
 * signals for each symbol in clientConfig.symbols, and sends a Telegram message
 * if an alert is triggered.
 *
 * The worker ensures no overlapping scans, handles graceful shutdown, and logs
 * structured data for monitoring.
 *
 * @returns {Promise<void>}
 */
export async function startWorker(): Promise<void> {
    const exchange = new ExchangeService();
    const strategy = new Strategy(3);
    const telegram = new TelegramService();

    try {
        await exchange.initialize(clientConfig.symbols);
        logger.info('Exchange initialized', { symbols: clientConfig.symbols });
    } catch (err) {
        logger.error('Failed to initialize exchange', { error: err });
        throw err;
    }

    // Handle graceful shutdown
    const cleanup = async () => {
        logger.info('Shutting down worker');
        isRunning = false;
        exchange.stopAll();
        await releaseLock();
        process.exit(0);
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    // Schedule the worker to run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        if (isRunning || !(await acquireLock())) {
            logger.warn('Scan skipped: another scan is running or lock acquisition failed');
            return;
        }

        isRunning = true;
        const scanStart = new Date();
        logger.info('Scan started', { timestamp: scanStart.toISOString() });

        try {
            for (const symbol of clientConfig.symbols) {
                const ohlcv = exchange.getOHLCV(symbol);
                if (!ohlcv || ohlcv.length < 50) {
                    logger.warn('Insufficient OHLCV data', { symbol, ohlcvLength: ohlcv?.length || 0 });
                    continue;
                }

                // Validate OHLCV data
                const highs = ohlcv.map(c => Number(c[2])).filter(v => !isNaN(v));
                const lows = ohlcv.map(c => Number(c[3])).filter(v => !isNaN(v));
                const closes = ohlcv.map(c => Number(c[4])).filter(v => !isNaN(v));
                const volumes = ohlcv.map(c => Number(c[5])).filter(v => !isNaN(v));
                if (closes.length < 50) {
                    logger.warn('Invalid OHLCV data after filtering', { symbol, closesLength: closes.length });
                    continue;
                }

                const price = closes.at(-1)!;

                // Generate a signal for the current symbol
                const signal = strategy.generateSignal({
                    symbol,
                    highs,
                    lows,
                    closes,
                    volumes,
                });

                // Fetch active alerts for this symbol
                const alerts = await dbService.getAlertsBySymbol(symbol);

                // Iterate over each alert and check if the condition is satisfied
                for (const alert of alerts) {
                    let triggered = false;
                    let triggerReason = '';

                    // Match alert condition to signal
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
                            `• Price: $${price.toFixed(4)}`,
                            `• Indicators: ${signal.reason.join(', ')}`,
                            `• ROI Est: ${strategy.lastAtr ? ((3 * strategy.lastAtr / price) * 100).toFixed(2) + '%' : 'N/A'}`,
                            alert.note ? `• Note: ${alert.note}` : ''
                        ].filter(Boolean).join('\n');

                        try {
                            await telegram.sendMessage(msg);
                            logger.info('Alert sent', { symbol, alertId: alert.id, message: msg });
                        } catch (err) {
                            logger.error('Failed to send Telegram message', { symbol, alertId: alert.id, error: err });
                        }
                    }

                    logger.info('Alert checked', { symbol, alertId: alert.id, triggered });
                }
            }
        } catch (err) {
            logger.error('Error during scan', { error: err });
        } finally {
            isRunning = false;
            await releaseLock();
            const scanEnd = new Date();
            logger.info('Scan finished', { timestamp: scanEnd.toISOString(), durationMs: scanEnd.getTime() - scanStart.getTime() });
        }
    });

    logger.info('Worker started', { symbols: clientConfig.symbols });
}