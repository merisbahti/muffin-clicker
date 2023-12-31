<script lang="ts">
	import { notificationsStore } from '$lib/components/notifications.svelte';

	import Toast from '$lib/components/toast.svelte';
	import {
		getCountAtTime,
		type EventType,
		type FullState,
		nonClickEventTypes,
		getCost,
		AddEventResponseSchema
	} from '../model/farmerState';
	import * as R from 'remeda';
	import { UserResponseSchema, type UserResponse } from './api/events/types';
	import { createLocalStorageRune } from '$lib/utils/localstorage-rune.svelte';
	import { z } from 'zod';
	const formatNumber = (nr: number) =>
		new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(nr);
	const getCurrentTimestamp = () => new Date().getTime();

	let userId = createLocalStorageRune('userId', z.union([z.string(), z.null()]), null);

	let userState = $state<UserResponse | null>(null);

	$effect(() => {
		const fn = async () =>
			await fetch('/api/events', {
				...(userId.value ? { headers: { 'x-user-id': userId.value } } : {})
			})
				.then((x) => x.json())
				.then(UserResponseSchema.parseAsync)
				.then((x) => {
					userId.value = x.id;
					userState = x;
				});
		fn();
	});

	let timer = $state(getCurrentTimestamp());
	const resolution = 50;

	setInterval(() => {
		timer = getCurrentTimestamp();
	}, resolution);

	const countInfo = $derived(
		(() => {
			if (userState === null) return null;
			const currentCount = getCountAtTime(userState.events, timer);
			const count10SecondsAgo = getCountAtTime(userState.events, timer - 1000);

			return {
				totalCurrentCount: Math.floor(currentCount),
				rate: currentCount - count10SecondsAgo
			};
		})()
	);

	const registerEvent = async (eventType: EventType) => {
		if (!userId.value) {
			notificationsStore.danger('not logged in', 1000);
			return;
		}
		const result = await fetch('/api/events', {
			method: 'PUT',
			body: JSON.stringify({ eventType: eventType }),
			headers: { 'x-user-id': userId.value }
		})
			.then((x) => x.json())
			.then(AddEventResponseSchema.parseAsync);

		switch (result.type) {
			case 'success':
				if (userState) userState.events = result.newState;
				break;
			case 'failure':
				notificationsStore.danger(result.error, 1000);
				break;
		}
	};

	const getEventTypeCount = (eventType: EventType) =>
		userState?.events.filter((x) => x.type === eventType).length ?? 0;

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
			{#if countInfo === null}
				<div>Loading...</div>
			{:else}
				<button on:click={() => registerEvent('click')}
					>{formatNumber(countInfo.totalCurrentCount)}</button
				>
				<div>Rate: {countInfo.rate.toFixed(2)}/s</div>
			{/if}
		</div>
		<div class="bg-gray-400 max-h-fit flex flex-col" style="width: 100%">
			{#each nonClickEventTypes as eventType}
				<button type="button" class="bg-slate-500" on:click={() => registerEvent(eventType)}
					>{eventType}: {derivedCounts[eventType]} (cost: {formatNumber(
						getCost(eventType, derivedCounts[eventType])
					)})</button
				>
			{/each}
		</div>
	</div>
</div>

<style>
</style>
