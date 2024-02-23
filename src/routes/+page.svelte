<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@sveltestack/svelte-query';

	let count = $state(0);

	export const queryClient = new QueryClient();
	import Toast from '$lib/components/toast.svelte';
	import Muffin from './components/muffin.svelte';
</script>

<svelte:head>
	<title>Muffin Clicker - {count}</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<Toast></Toast>
	<Muffin
		onCountUpdate={(newCount) => {
			count = newCount;
		}}
	/>
</QueryClientProvider>
