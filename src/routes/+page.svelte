<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@sveltestack/svelte-query';

	const queryClient = new QueryClient();
	import Toast from '$lib/components/toast.svelte';
	import Muffin from './components/muffin.svelte';
</script>

<svelte:head>
	<title>Muffin Clicker - put count here later</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<Toast></Toast>
	<Muffin />
</QueryClientProvider>
