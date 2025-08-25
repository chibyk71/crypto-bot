import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod } from "sveltekit-superforms/adapters";
import { alertSchema } from '$lib/config/schema';
import { fail, redirect } from '@sveltejs/kit';
import { dbService } from '$lib/server/db';

export const load = (async () => {
    return {
        form: await superValidate(zod(alertSchema)),
    };
}) satisfies PageServerLoad;


export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event.request, zod(alertSchema));
        if (!form.valid) {
            return fail(400, { error: 'Invalid input', form });
        }
        // Validate and process the alert form data here
        const { symbol, condition, targetPrice, note } = form.data;
        await dbService.createAlert({
            symbol,
            condition,
            targetPrice,
            note,
        });

        throw redirect(303, '/alerts');
    },
};
