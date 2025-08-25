import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { type Alert, type NewAlert, alert as alerts } from '$lib/server/db/schema';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';


if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = createClient({ url: env.DATABASE_URL });

export const db = drizzle(client, { schema });

// Query functions
export const dbService = {
    // Create a new alert
    async createAlert(alert: NewAlert): Promise<Alert> {
        const [inserted] = await db.insert(alerts).values(alert).returning();
        return inserted;
    },

    // Fetch all active alerts
    async getActiveAlerts(): Promise<Alert[]> {
        return db.select().from(alerts).where(eq(alerts.status, 'active'));
    },

    // Fetch alerts by symbol
    async getAlertsBySymbol(symbol: string): Promise<Alert[]> {
        return db
            .select()
            .from(alerts)
            .where(and(eq(alerts.symbol, symbol), eq(alerts.status, 'active')));
    },

    // Update alert status (e.g., to 'triggered' or 'canceled')
    async updateAlertStatus(id: number, status: 'triggered' | 'canceled'): Promise<Alert> {
        const [updated] = await db
            .update(alerts)
            .set({ status })
            .where(eq(alerts.id, id))
            .returning();
        return updated;
    },

    // Delete an alert
    async deleteAlert(id: number): Promise<void> {
        await db.delete(alerts).where(eq(alerts.id, id));
    },
};