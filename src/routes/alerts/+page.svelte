<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function deleteAlert(id: number) {
		if (confirm('Delete this alert?')) {
			await fetch(`/alerts?id=${id}`, { method: 'DELETE' });
			window.location.reload(); // Simple refresh; improve with SvelteKit invalidation later
		}
	}
</script>

<div class="space-y-4">
	<h2 class="text-2xl font-bold">Active Alerts</h2>
	{#if data.alerts.length === 0}
		<p class="text-gray-500">No active alerts.</p>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Symbol</TableHead>
					<TableHead>Condition</TableHead>
					<TableHead>Target Price</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Created At</TableHead>
					<TableHead>Note</TableHead>
					<TableHead>Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each data.alerts as alert}
					<TableRow>
						<TableCell>{alert.symbol}</TableCell>
						<TableCell>{alert.condition}</TableCell>
						<TableCell>${alert.targetPrice.toFixed(2)}</TableCell>
						<TableCell>{alert.status}</TableCell>
						<TableCell>{new Date(alert.createdAt || '').toLocaleString()}</TableCell>
						<TableCell>{alert.note || '-'}</TableCell>
						<TableCell>
							<Button variant="destructive" onclick={() => deleteAlert(alert.id)}>Delete</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{/if}
</div>
