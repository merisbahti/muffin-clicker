import { expect, test } from 'vitest';
import { getProductionAtTime, type FullState, getCosts, addEvent } from './farmerState';

test('clicks are correctly counted', () => {
	const fullState: FullState = [
		{ type: 'click', timestamp: 0 },
		{ type: 'click', timestamp: 1000 },
		{ type: 'click', timestamp: 2000 },
		{ type: 'click', timestamp: 3000 }
	];
	const result = getProductionAtTime(fullState, 4000);

	expect(result).toBe(4);
});

test("clicks aren't counted negatively", () => {
	const fullState: FullState = [{ type: 'grandma', timestamp: 1000 }];
	const result = getProductionAtTime(fullState, 0);

	expect(result).toBe(0);
});

test('grandma clicks are correctly counted', () => {
	const fullState: FullState = [{ type: 'grandma', timestamp: 0 }];
	const result = getProductionAtTime(fullState, 10000);

	expect(result).toBe(1);
});

test('double grandma clicks are correctly counted', () => {
	const fullState: FullState = [
		{ type: 'grandma', timestamp: 0 },
		{ type: 'grandma', timestamp: 0 }
	];
	const result = getProductionAtTime(fullState, 10000);

	expect(result).toBe(2);
});

test('grandma + factory clicks are correctly counted', () => {
	const fullState: FullState = [
		{ type: 'grandma', timestamp: 0 },
		{ type: 'factory', timestamp: 1000 }
	];

	expect(getProductionAtTime(fullState, 0)).toBe(0);
	expect(getProductionAtTime(fullState, 1000)).toBe(0.1);
	expect(getProductionAtTime(fullState, 1500)).toBe(0.4);
	expect(getProductionAtTime(fullState, 15000)).toBe(8.5);
});

test('base costs are as expected', () => {
	const fullState: FullState = [];
	const result = getCosts(fullState);

	expect(result).toEqual({
		grandma: 15,
		factory: 100
	});
});

test('costs are increasing are as expected', () => {
	expect(getCosts([{ type: 'grandma', timestamp: 0 }])).toEqual({
		grandma: 18,
		factory: 100
	});
	expect(
		getCosts([
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 }
		])
	).toEqual({
		grandma: 20,
		factory: 100
	});
	expect(
		getCosts([
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 }
		])
	).toEqual({
		grandma: 23,
		factory: 100
	});
	expect(
		getCosts([
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 },
			{ type: 'grandma', timestamp: 0 }
		])
	).toEqual({
		grandma: 27,
		factory: 100
	});
});

test('events are validated by addEvent', () => {
	const fullState: FullState = [];
	const result = addEvent(fullState, { type: 'grandma', timestamp: 0 });

	expect(result).toEqual({
		type: 'failure',
		error: 'Not enough clicks (you have 0, and need 15)'
	});
});

test('events are validated by addEvent', () => {
	const fullState: FullState = [...new Array(15)].map(() => ({ type: 'click', timestamp: 0 }));
	const result = addEvent(fullState, { type: 'grandma', timestamp: 1000 });

	expect(result).toEqual({
		type: 'success',
		newState: [...fullState, { type: 'grandma', timestamp: 1000 }]
	});
});
