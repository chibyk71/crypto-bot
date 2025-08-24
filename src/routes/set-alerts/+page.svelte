<script lang="ts">
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from '$lib/components/ui/select';
	import { enhance } from '$app/forms';
	import { config } from '$lib/config/settings';

	let { data }: PageProps = $props();

	let symbol = $state(config.symbols[0]);
	let condition = $state('price >');
	let targetPrice = $state<number>();
	let note = $state('');

	const conditions = [
		{ value: 'price >', label: 'Price Above' },
		{ value: 'price <', label: 'Price Below' },
		{ value: 'crosses_above_ema200', label: 'Crosses Above EMA200' },
		{ value: 'crosses_below_ema200', label: 'Crosses Below EMA200' }
	];
</script>

<div class="mx-auto max-w-md space-y-6">
	<h2 class="text-2xl font-bold">Set New Alert</h2>
	<form method="POST" use:enhance class="space-y-4">
		<div>
			<Label for="symbol">Symbol</Label>
			<Select bind:value={symbol} name="symbol">
				<SelectTrigger>
					<SelectValue placeholder="Select symbol" />
				</SelectTrigger>
				<SelectContent>
					{#each config.symbols as sym}
						<SelectItem value={sym}>{sym}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>
		<div>
			<Label for="condition">Condition</Label>
			<Select bind:value={condition} name="condition">
				<SelectTrigger>
					<SelectValue placeholder="Select condition" />
				</SelectTrigger>
				<SelectContent>
					{#each conditions as cond}
						<SelectItem value={cond.value}>{cond.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>
		<div>
			<Label for="targetPrice">Target Price</Label>
			<Input type="number" name="targetPrice" bind:value={targetPrice} required step="0.01" />
		</div>
		<div>
			<Label for="note">Note (Optional)</Label>
			<Input type="text" name="note" bind:value={note} />
		</div>
		<Button type="submit">Create Alert</Button>
	</form>
</div>
