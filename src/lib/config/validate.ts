import { z } from 'zod';
import { env } from '$env/dynamic/private';

const envSchema = z.object({
    BYBIT_API_KEY: z.string().min(1, 'Bybit API key is required'),
    BYBIT_API_SECRET: z.string().min(1, 'Bybit API secret is required'),
    TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
    TELEGRAM_CHAT_ID: z.string().min(1, 'Telegram chat ID is required'),
    DATABASE_URL: z.string().min(1, 'Database URL is required'),
});

export function validateConfig() {
    const result = envSchema.safeParse(env);
    if (!result.success) {
        throw new Error(`Configuration error: ${result.error.message}`);
    }
    return result.data;
}