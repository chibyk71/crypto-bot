<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white p-4 shadow">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<h1 class="text-xl font-bold">Crypto Trading Bot</h1>
			<div class="space-x-4">
				<Button href="/alerts" variant={page.url.pathname === '/alerts' ? 'default' : 'outline'}>
					Alerts
				</Button>
				<Button
					href="/set-alerts"
					variant={page.url.pathname === '/set-alerts' ? 'default' : 'outline'}
				>
					Set Alert
				</Button>
			</div>
			<div class="flex">
				<Button
					href="/demo/lucia/login"
					variant={page.url.pathname === '/demo/lucia/login' ? 'default' : 'outline'}
				>
					Login
				</Button>
			</div>
		</div>
	</nav>
	<main class="mx-auto max-w-7xl p-4">
		{@render children?.()}
	</main>
</div>
