import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Estimate potential ROI using ATR as a volatility proxy.
 * Assumes a price move of 3x ATR could occur (heuristic for 3% ROI target).
 * 
 * @param atr - Average True Range (volatility measure)
 * @param currentPrice - Current asset price
 * @param direction - Trade direction ('buy' | 'sell')
 * @returns Estimated ROI percentage (positive for buy, negative for sell)
 */
export function estimateROI(
	atr: number,
	currentPrice: number,
	direction: 'buy' | 'sell'
): number {
	if (atr <= 0) throw new Error('ATR must be positive');
	if (currentPrice <= 0) throw new Error('Current price must be positive');

	const potentialMove = atr * 3; // heuristic multiplier for target move
	const roi = (potentialMove / currentPrice) * 100;

	return direction === 'buy' ? roi : -roi;
}
