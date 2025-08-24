import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { type Alert, type NewAlert, alert as alerts } from '$lib/server/db/schema';
import { and } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
    const alerts = await dbService.getActiveAlerts();
    return { alerts };
};

export const actions = {
    default: async ({ request }) => {
        const id = Number(new URL(request.url).searchParams.get('id'));
        if (id) {
            await dbService.deleteAlert(id);
            return { success: true };
        }
        return { success: false, error: 'No ID provided' };
    },
} satisfies Actions;

// Query functions
const dbService = {
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