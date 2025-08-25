import { z } from "zod";

export const alertSchema = z.object({
    symbol: z.string(),
    condition: z.string(), // e.g., 'price >', 'price <', 'crosses_above_ema200', 'crosses_below_ema200'
    targetPrice: z.number(),
    status: z.string().default('active'), // 'active', 'triggered', 'canceled'
    createdAt: z.string().default('CURRENT_TIMESTAMP'),
    note: z.string().optional(), // Optional user note
});

export type AlertSchema = typeof alertSchema;