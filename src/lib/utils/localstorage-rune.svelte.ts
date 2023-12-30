import { browser } from '$app/environment';
import { onMount } from 'svelte';
import type { ZodTypeAny } from 'zod';

export const createLocalStorageRune = <Schema extends ZodTypeAny>(
	key: string,
	schema: Schema,
	defaultValue: Schema['_type']
): { value: Schema['_type'] } => {
	const localStorage = browser ? window.localStorage : null;
	const getValueFromLocalStorage = () => {
		const initialValue = schema.safeParse(JSON.parse(localStorage?.getItem(key) ?? 'null'));
		return initialValue.success ? initialValue.data : defaultValue;
	};
	let state = $state(getValueFromLocalStorage());

	onMount(() => {
		state = getValueFromLocalStorage();
		console.log('gettng value', state, browser, localStorage);
		localStorage?.setItem(key, JSON.stringify(state));
	});

	$effect(() => {
		console.log('setting to ', state, `in env: ${browser ? 'browser' : 'server'}`);
		localStorage?.setItem(key, JSON.stringify(state));
	});

	return {
		get value() {
			return state;
		},
		set value(v) {
			state = v;
		}
	};
};
