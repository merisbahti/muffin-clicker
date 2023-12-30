<script lang="ts">
	import { notificationsStore } from '$lib/components/notifications.svelte';
	import Toast from '$lib/components/toast.svelte';
	import {
		getCountAtTime,
		type EventType,
		type FullState,
		nonClickEventTypes,
		getCost,
		addEvent
	} from '../../model/farmerState';
	import * as R from 'remeda';

	const getCurrentTimestamp = () => new Date().getTime();

	let events: FullState = $state([]);

	let timer = $state(getCurrentTimestamp());

	setInterval(() => {
		timer = getCurrentTimestamp();
	}, 100);

	const totalCurrentCount = $derived(Math.floor(getCountAtTime(events, timer)));

	const registerEvent = (eventType: EventType) => {
		const result = addEvent(events, { type: eventType, timestamp: getCurrentTimestamp() });

		switch (result.type) {
			case 'success':
				events = result.newState;
				break;
			case 'failure':
				notificationsStore.danger(result.error, 1000);
				break;
		}
	};

	const getEventTypeCount = (eventType: EventType) =>
		events.filter((x) => x.type === eventType).length;

	const derivedCounts = $derived(
		R.mapToObj(
			nonClickEventTypes,
			(eventType) => [eventType, getEventTypeCount(eventType)] as const
		)
	);
</script>

<svelte:head>
	<title>Muffin Clicker</title>
</svelte:head>

<div>
	<Toast></Toast>
	<h1>Muffin Clicker</h1>
	<div class="flex flex-row space-between">
		<div style="width: 100%">
			<button on:click={() => registerEvent('click')}>{totalCurrentCount}</button>
		</div>
		<div class="bg-gray-400 max-h-fit flex flex-col" style="width: 100%">
			{#each nonClickEventTypes as eventType}
				<button type="button" class="bg-slate-500" on:click={() => registerEvent(eventType)}
					>{eventType}: {derivedCounts[eventType]} (cost: {getCost(
						eventType,
						derivedCounts[eventType]
					)})</button
				>
			{/each}
		</div>
	</div>
</div>

<style>
</style>
