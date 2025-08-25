import { startWorker } from '$lib/worker';

let started = false;

export async function POST() {
    if (!started) {
        startWorker();
        started = true;
        return new Response('Worker started', { status: 200 });
    }
    return new Response('Worker already running', { status: 200 });
}