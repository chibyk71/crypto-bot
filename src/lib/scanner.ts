// src/lib/server/scanner.ts
import { ExchangeService } from './services/exchange';
import { TelegramService } from './services/telegram';
import { Strategy, type TradeSignal } from './strategy';

type ScannerOptions = {
    /** Scan interval in ms (e.g., 15000) */
    intervalMs: number;
    /** Max symbols processed concurrently */
    concurrency: number;
    /** Avoid spamming: per-symbol alert cooldown (ms) */
    cooldownMs?: number; // default 5 minutes
    /** Optional jitter to spread calls under rate limits (ms) */
    jitterMs?: number; // e.g., 250
    /** Optional retries per symbol on transient error */
    retries?: number; // default 1
    /** Send a heartbeat every N scans */
    heartbeatEvery?: number;
    /** Require ATR-based 3x move to be >= target ROI before alerting */
    requireAtrFeasibility?: boolean; // default true
};

export class MarketScanner {
    private running = false;
    private timer: NodeJS.Timeout | null = null;
    private scanCount = 0;
    private lastAlertAt: Record<string, number> = {};

    constructor(
        private readonly exchange: ExchangeService,
        private readonly strategy: Strategy,
        private readonly symbols: string[],
        private readonly telegram = new TelegramService(),
        private readonly opts: ScannerOptions = {
            intervalMs: 15000,
            concurrency: 3,
            cooldownMs: 5 * 60_000,
            jitterMs: 250,
            retries: 1,
            heartbeatEvery: 20,
            requireAtrFeasibility: true,
        }
    ) { }

    start(): void {
        if (this.running) return;
        this.running = true;

        // kick off immediately, then schedule
        void this.runOnce();
        this.timer = setInterval(() => {
            if (!this.running) return;
            void this.runOnce();
        }, this.opts.intervalMs);
    }

    stop(): void {
        this.running = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async runOnce(): Promise<void> {
        const {
            concurrency,
            jitterMs = 0,
            retries = 1,
            heartbeatEvery,
        } = this.opts;

        this.scanCount += 1;

        if (heartbeatEvery && this.scanCount % heartbeatEvery === 0) {
            this.telegram
                .sendMessage(`🫀 Heartbeat: scan #${this.scanCount} over ${this.symbols.length} symbols.`)
                .catch(() => { });
        }

        const queue = [...this.symbols];
        const workers = Array.from(
            { length: Math.min(concurrency, queue.length) },
            () => this.worker(queue, jitterMs, retries)
        );

        await Promise.all(workers);
    }

    private async worker(queue: string[], jitterMs: number, retries: number): Promise<void> {
        while (queue.length) {
            const symbol = queue.shift();
            if (!symbol) break;

            if (jitterMs > 0) {
                await new Promise((r) => setTimeout(r, Math.floor(Math.random() * jitterMs)));
            }

            try {
                await this.withRetries(() => this.processSymbol(symbol), retries);
            } catch (err) {
                const msg = (err as Error)?.message ?? String(err);
                this.telegram.sendMessage(`⚠️ ${symbol} scan error: ${msg}`).catch(() => { });
            }
        }
    }

    private async processSymbol(symbol: string): Promise<void> {
        const ohlcv = this.exchange.getOHLCV(symbol);
        if (!ohlcv || ohlcv.length < 200) return;

        const highs = ohlcv.map(c => Number(c[2]));
        const lows = ohlcv.map(c => Number(c[3]));
        const closes = ohlcv.map(c => Number(c[4]));
        const volumes = ohlcv.map(c => Number(c[5]));
        const currentPrice = closes.at(-1)!;

        // Generate signal
        const signal: TradeSignal = this.strategy.generateSignal({
            symbol,
            highs,
            lows,
            closes,
            volumes,
        });

        if (signal.signal === 'hold') return;

        // Optional feasibility check: require that 3 * ATR implies >= target ROI
        if (this.opts.requireAtrFeasibility !== false) {
            const atr = this.strategy.lastAtr; // expose last ATR from strategy (see below)
            if (atr && atr > 0) {
                const atrMovePct = (3 * atr / currentPrice) * 100;
                if (atrMovePct < this.strategy.riskRewardTarget) {
                    // Not enough volatility to reasonably target 3% — skip alert
                    return;
                }
            }
        }

        // Cooldown guard
        const now = Date.now();
        const last = this.lastAlertAt[symbol] ?? 0;
        const cooldownMs = this.opts.cooldownMs ?? 5 * 60_000;
        if (now - last < cooldownMs) return;

        this.lastAlertAt[symbol] = now;

        // Format & send Telegram alert
        const lines = [
            signal.signal === 'buy' ? '🚀 BUY SIGNAL' : '🔻 SELL SIGNAL',
            `• Symbol: ${symbol}`,
            `• Confidence: ${signal.confidence}%`,
            `• Price: $${currentPrice.toFixed(4)}`,
        ];
        if (signal.stopLoss) lines.push(`• Stop: $${signal.stopLoss.toFixed(4)}`);
        if (signal.takeProfit) lines.push(`• Take Profit: $${signal.takeProfit.toFixed(4)} (~${this.strategy.riskRewardTarget}%)`);
        if (signal.reason?.length) {
            lines.push('• Reasons:');
            for (const r of signal.reason.slice(0, 6)) lines.push(`   - ${r}`);
        }

        await this.telegram.sendMessage(lines.join('\n'));
    }

    private async withRetries<T>(fn: () => Promise<T>, retries: number): Promise<T> {
        let err: unknown;
        for (let i = 0; i <= retries; i++) {
            try {
                return await fn();
            } catch (e) {
                err = e;
                await new Promise((r) => setTimeout(r, 300 * (i + 1)));
            }
        }
        throw err;
    }
}
