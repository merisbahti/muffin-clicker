<script lang="ts">
	import {
		deriveKills,
		type EventType,
		type FullState,
		nonClickEventTypes
	} from '../../model/farmerState';
	import * as R from 'remeda';

	const getCurrentTimestamp = () => new Date().getTime();

	let events: FullState = $state({ eventList: [] });

	let timer = $state(getCurrentTimestamp());

	setInterval(() => {
		timer = getCurrentTimestamp();
	}, 100);

	const totalCurrentCount = $derived(Math.floor(deriveKills(events, timer)));

	const registerEvent = (eventType: EventType) =>
		events.eventList.push({ type: eventType, timestamp: getCurrentTimestamp() });

	const getEventTypeCount = (eventType: EventType) =>
		events.eventList.filter((x) => x.type === eventType).length;

	const derivedCounts = $derived(
		R.mapToObj(
			nonClickEventTypes,
			(eventType) => [eventType, getEventTypeCount(eventType)] as const
		)
	);
</script>

<svelte:head>
	<title>Monster farmer</title>
</svelte:head>

<div>
	<h1>Monster Farmer</h1>
	<div class="flex flex-row space-between">
		<div style="width: 100%">
			<button on:click={() => registerEvent('click')}>{totalCurrentCount}</button>
		</div>
		<div class="bg-gray-400 max-h-fit flex flex-col" style="width: 100%">
			{#each nonClickEventTypes as eventType}
				<button type="button" class="bg-slate-500" on:click={() => registerEvent(eventType)}
					>{eventType}: {derivedCounts[eventType]}</button
				>
			{/each}
		</div>
	</div>
</div>

<style>
</style>
