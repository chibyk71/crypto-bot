<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Button onclick={startWorker} class="mt-4">Start Crypto Bot Worker</Button>
<p id="worker-status"></p>

<script lang="ts">
	import { Button } from "$lib/components/ui/button";

    async function startWorker() {
        const res = await fetch('/api/start-worker', { method: 'POST' });
        const text = await res.text();
        document.getElementById('worker-status')!.textContent = text;
    }
</script>
