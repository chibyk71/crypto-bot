import { dbService } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';

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