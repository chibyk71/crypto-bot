<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<button on:click={startWorker}>Start Crypto Bot Worker</button>
<p id="worker-status"></p>

<script lang="ts">
    async function startWorker() {
        const res = await fetch('/api/start-worker', { method: 'POST' });
        const text = await res.text();
        document.getElementById('worker-status')!.textContent = text;
    }
</script>
