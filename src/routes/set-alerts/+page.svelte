<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { config } from '$lib/config/settings';

	import { alertSchema, type AlertSchema } from '$lib/config/schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import FormField from '$lib/components/ui/form/form-field.svelte';
	import FormFieldErrors from '$lib/components/ui/form/form-field-errors.svelte';
	import { Button, FormControl } from '$lib/components/ui/form';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	let { data }: { data: { form: SuperValidated<Infer<AlertSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(alertSchema)
	});

	const { form: formData, enhance } = form;

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
        <FormField name="symbol" {form}>
            <FormControl>
                {#snippet children({props})}
                    <Label for="symbol">Symbol</Label>
                    <Select bind:value={$formData.symbol} name="symbol" type='single'>
                        <SelectTrigger {...props}>{$formData.symbol? $formData.symbol : 'Select Symbol'}</SelectTrigger>
                        <SelectContent>
                            {#each config.symbols as sym}
                                <SelectItem value={sym}>{sym}</SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                {/snippet}
            </FormControl>
            <FormFieldErrors />
		</FormField>
		<FormField name="condition" {form}>
            <FormControl>
                {#snippet children({ props })}
                    <Label for="condition">Condition</Label>
                    <Select bind:value={$formData.condition} name="condition" type='single'>
                        <SelectTrigger {...props}>
                            {$formData.condition ? $formData.condition: 'Select Condition'}
                        </SelectTrigger>
                        <SelectContent>
                            {#each conditions as cond}
                                <SelectItem value={cond.value}>{cond.label}</SelectItem>
                            {/each}
                        </SelectContent>
                    </Select>
                {/snippet}
            </FormControl>
		</FormField>
        <FormField {form} name="targetPrice">
            <FormControl>
                {#snippet children({ props })}
                    <Label>Target Price</Label>
                    <Input type="number" {...props} bind:value={$formData.targetPrice} required step="0.01" />
                {/snippet}
            </FormControl>
            <FormFieldErrors />
        </FormField>
        <FormField {form} name="note">
            <FormControl>
                {#snippet children({ props })}
                    <Label>Note (Optional)</Label>
                    <Textarea {...props} bind:value={$formData.targetPrice} />
                {/snippet}
            </FormControl>
            <FormFieldErrors />
        </FormField>
		<Button type="submit">Create Alert</Button>
	</form>
</div>
