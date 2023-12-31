<script lang="ts">
	import { notificationsStore } from '$lib/components/notifications.svelte';

	import Toast from '$lib/components/toast.svelte';
	import {
		getCountAtTime,
		type EventType,
		type FullState,
		nonClickEventTypes,
		getCost,
		AddEventResponseSchema,
		clicksPerSecond,
		eventTypes,
		eventTypesSchema,
		type NonClickEvent,
		type NonClickEventType
	} from '../model/farmerState';
	import * as R from 'remeda';
	import { UserResponseSchema, type UserResponse } from './api/events/types';
	import { createLocalStorageRune } from '$lib/utils/localstorage-rune.svelte';
	import { z } from 'zod';
	import muffinImage from '$lib/images/muffin-removebg-preview.png';
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
		R.mapToObj(eventTypes, (eventType) => [eventType, getEventTypeCount(eventType)] as const)
	);

	const shouldBeHidden = (eventType: EventType) => {
		const myIndex = eventTypes.indexOf(eventType);
		if (myIndex === 0) return false;
		const previousEventType = eventTypes[myIndex - 1];
		return derivedCounts[previousEventType] === 0;
	};
</script>

<svelte:head>
	<title>Muffin Clicker</title>
</svelte:head>

<div>
	<Toast></Toast>
	<h1>Muffin Clicker</h1>
	<div class="flex flex-row space-between">
		<div class="flex flex-col w-full content-center">
			{#if countInfo === null}
				<div>Loading...</div>
			{:else}
				<div
					aria-roledescription="button"
					role="button"
					tabindex="-1"
					class="mx-auto my-auto text-center"
					on:click={() => registerEvent('click')}
				>
					{formatNumber(countInfo.totalCurrentCount)}
					<img src={muffinImage} class="" alt="muffin" />
					<div>Rate: {countInfo.rate.toFixed(2)}/s</div>
				</div>
			{/if}
		</div>
		<div class="flex flex-col w-f space-y-5" style="width: 100%">
			{#each nonClickEventTypes as eventType}
				{#if !shouldBeHidden(eventType)}
					<button class="w-fill items-center" on:click={() => registerEvent(eventType)}>
						<div class="bg-slate-500 flex flex-row space-x-4 justify-between w-1/2">
							<div class="flex flex-col w-fill">
								<div>
									{eventType}
								</div>
								<div>
									cost: {formatNumber(getCost(eventType, derivedCounts[eventType]))}, rate {clicksPerSecond[
										eventType
									]}
								</div>
							</div>
							<div class="font-bold text-3xl my-auto">{derivedCounts[eventType]}</div>
						</div>
					</button>
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
</style>
