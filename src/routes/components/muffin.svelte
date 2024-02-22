<script lang="ts">
	import { notificationsStore } from '$lib/components/notifications.svelte';

	import {
		getCountAtTime,
		type EventType,
		type FullState,
		nonClickEventTypes,
		getCost,
		AddEventResponseSchema,
		clicksPerSecond,
		eventTypes,
		type NonClickEvent,
		type NonClickEventType,
		addEvent
	} from '../../model/farmerState';
	import * as R from 'remeda';
	import { UserResponseSchema, type UserResponse } from './../api/events/types';
	import { createLocalStorageRune } from '$lib/utils/localstorage-rune.svelte';
	import { z } from 'zod';
	import muffinImage from '$lib/images/muffin-removebg-preview.png';
	import { useQuery } from '@sveltestack/svelte-query';
	const formatNumber = (nr: number) =>
		new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(nr);
	const getCurrentTimestamp = () => new Date().getTime();

	let userId = createLocalStorageRune('userId', z.union([z.string(), z.null()]), null);

	const queryResult = useQuery({
		queryKey: 'user-response-key',
		queryFn: () => {
			return Promise.resolve('hello');
		},
		enabled: true
	});

	let userState = useQuery({
		queryKey: ['user-state'],
		queryFn: async () =>
			await fetch('/api/events', {
				...(userId.value ? { headers: { 'x-user-id': userId.value } } : {})
			})
				.then((x) => x.json())
				.then(UserResponseSchema.parseAsync)
	});

	$effect(() => {
		userId.value = $userState.data?.id ?? null;
	});

	let timer = $state(getCurrentTimestamp());
	const resolution = 50;

	setInterval(() => {
		timer = getCurrentTimestamp();
	}, resolution);

	const countInfo = $derived.by(() => {
		if (!$userState.data) return null;
		const currentCount = getCountAtTime($userState.data.events, timer);
		const count10SecondsAgo = getCountAtTime($userState.data.events, timer - 1000);

		return {
			totalCurrentCount: Math.floor(currentCount),
			rate: currentCount - count10SecondsAgo
		};
	});

	const registerEvent = async (eventType: EventType) => {
		if (!userId.value || !$userState.data) {
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
				// if (userState) userState.events = result.newState;
				break;
			case 'failure':
				notificationsStore.danger(result.error, 1000);
				break;
		}
	};

	const getEventTypeCount = (eventType: EventType) =>
		$userState.data?.events.filter((x) => x.type === eventType).length ?? 0;

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

<div>
	<div class="flex flex-row max-md:flex-col max-md:space-y-12 space-between pt-12">
		<div class="flex flex-col w-full content-center">
			{#if countInfo === null}
				<div>Loading...</div>
			{:else}
				<button class="mx-auto my-auto text-center" on:click={() => registerEvent('click')}>
					<div>
						<div class="text-6xl">
							{formatNumber(countInfo.totalCurrentCount)}
						</div>
						<img draggable="false" class="muffin-click" src={muffinImage} alt="muffin" />
						<div>Rate: {countInfo.rate.toFixed(2)}/s</div>
					</div>
				</button>
			{/if}
		</div>
		<div class="flex flex-col w-f space-y-5 items-center" style="width: 100%">
			{#each nonClickEventTypes as eventType}
				{#if !shouldBeHidden(eventType)}
					<button
						class="scaling w-fill items-center w-1/2 shadow-black shadow-lg hover:scale-125 bg-green-600 hover:bg-green-400 disabled:opacity-50"
						disabled={getCost(eventType, derivedCounts[eventType]) >
							(countInfo?.totalCurrentCount ?? 0)}
						on:click={() => registerEvent(eventType)}
					>
						<div class="flex flex-row space-x-4 justify-between p-5 py-2">
							<div class="flex flex-col w-fill">
								<div class="text-xl">
									{eventType}
								</div>
								<div class="font-extralight">
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
	@keyframes spin-click {
		0% {
			transform: rotate(0) scale(1);
		}
		25% {
			transform: rotate(5deg) scale(0.916);
		}
		75% {
			transform: rotate(-5deg) scale(0.833);
		}
		100% {
			transform: rotate(0deg) scale(0.75);
		}
	}

	.muffin-click {
		transition-duration: 0.2s;
	}

	.muffin-click:hover {
		transform: scale(1.1); /* Scale the button 20% larger on hover */
		transition-duration: 0.2s;
	}

	.muffin-click:active {
		animation: spin-click 0.2s;
		animation-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
	}

	.muffin-click:active:hover {
		transform: scale(0.75);
		rotate: 0deg;
		transition-duration: 0.2s;
	}

	.scaling {
		transition-duration: 0.2s;
	}

	.scaling:hover {
		transform: scale(1.2); /* Scale the button 20% larger on hover */
		transition-duration: 0.2s;
	}

	.scaling:active {
		transform: scale(0.8); /* Scale the button 20% smaller on click */
		transition-duration: 0.2s; /* Animate the scaling back to original size */
	}

	.scaling:active:hover {
		transform: scale(1); /* Reset scaling to original size on hover after click */
		transition-duration: 0.1s;
	}
</style>
