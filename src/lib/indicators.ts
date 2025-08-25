import * as ti from 'technicalindicators';

/**
 * Calculates the Relative Strength Index (RSI) for a given set of closing prices.
 *
 * @param closes - Array of closing prices.
 * @param period - Lookback period for RSI calculation (default: 14).
 * @returns Array of RSI values (aligned with input length minus period).
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
    return ti.rsi({ values: closes, period }) as number[];
}

/**
 * Calculates the Moving Average Convergence Divergence (MACD) for a given set of closing prices.
 *
 * @param closes - Array of closing prices.
 * @param fastPeriod - Short-term EMA period (default: 12).
 * @param slowPeriod - Long-term EMA period (default: 26).
 * @param signalPeriod - Signal line EMA period (default: 9).
 * @returns Array of MACD results: { MACD, signal, histogram }.
 */
export function calculateMACD(
    closes: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
): Array<{ MACD: number; signal: number; histogram: number }> {
    return ti.macd({
        values: closes,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
    }) as Array<{ MACD: number; signal: number; histogram: number }>;
}

/**
 * Calculates the Exponential Moving Average (EMA) for a given set of closing prices.
 *
 * @param closes - Array of closing prices.
 * @param period - Lookback period for EMA calculation (default: 200).
 * @returns Array of EMA values.
 */
export function calculateEMA(closes: number[], period: number = 200): number[] {
    return ti.ema({ values: closes, period }) as number[];
}

/**
 * Calculates the Average True Range (ATR) for volatility estimation.
 *
 * @param highs - Array of high prices.
 * @param lows - Array of low prices.
 * @param closes - Array of closing prices.
 * @param period - Lookback period for ATR calculation (default: 14).
 * @returns Array of ATR values.
 */
export function calculateATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number = 14
): number[] {
    return ti.atr({
        high: highs,
        low: lows,
        close: closes,
        period,
    }) as number[];
}
