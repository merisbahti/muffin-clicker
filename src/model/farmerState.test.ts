import { expect, test } from 'vitest';
import { getProductionAtTime, type Events, getCosts, addEvent } from './farmerState';

test('clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'click', timestamp: 0 },
		{ type: 'click', timestamp: 1000 },
		{ type: 'click', timestamp: 2000 },
		{ type: 'click', timestamp: 3000 }
	];
	const result = getProductionAtTime(events, 4000);

	expect(result).toBe(4);
});

test("clicks aren't counted negatively", () => {
	const events: Events = [{ type: 'grandma', timestamp: 1000 }];
	const result = getProductionAtTime(events, 0);

	expect(result).toBe(0);
});

test('grandma clicks are correctly counted', () => {
	const events: Events = [{ type: 'grandma', timestamp: 0 }];
	const result = getProductionAtTime(events, 10000);

	expect(result).toBe(10);
});

test('double grandma clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'grandma', timestamp: 0 },
		{ type: 'grandma', timestamp: 0 }
	];
	const result = getProductionAtTime(events, 10000);

	expect(result).toBe(20);
});

test('grandma + factory clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'cursor', timestamp: 0 },
		{ type: 'grandma', timestamp: 1000 }
	];

	expect(getProductionAtTime(events, 0)).toBe(0);
	expect(getProductionAtTime(events, 1000)).toBe(0.1);
	expect(getProductionAtTime(events, 1500)).toBe(0.65);
	expect(getProductionAtTime(events, 15000)).toBe(15.5);
});

test('base costs are as expected', () => {
	const events: Events = [];
	const result = getCosts(events);

	expect(result).toEqual({
		cursor: 15,
		grandma: 100,
		'alchemy lab': 75000000000,
		bank: 1400000,
		factory: 130000,
		farm: 1100,
		mine: 12000,
		portal: 1000000000000,
		shipment: 5100000000,
		temple: 20000000,
		'time machine': 14000000000000,
		'wizard tower': 330000000
	});
});

test('costs are increasing are as expected', () => {
	const otherThings = {
		grandma: 100,
		'alchemy lab': 75000000000,
		bank: 1400000,
		factory: 130000,
		farm: 1100,
		mine: 12000,
		portal: 1000000000000,
		shipment: 5100000000,
		temple: 20000000,
		'time machine': 14000000000000,
		'wizard tower': 330000000
	};
	expect(getCosts([{ type: 'cursor', timestamp: 0 }])).toEqual({
		cursor: 18,
		...otherThings
	});
	expect(
		getCosts([
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 }
		])
	).toEqual({
		cursor: 20,
		...otherThings
	});
	expect(
		getCosts([
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 }
		])
	).toEqual({
		cursor: 23,
		...otherThings
	});
	expect(
		getCosts([
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 },
			{ type: 'cursor', timestamp: 0 }
		])
	).toEqual({
		cursor: 27,
		...otherThings
	});
});

test('events are validated by addEvent', () => {
	const events: Events = [];
	const result = addEvent(events, { type: 'cursor', timestamp: 0 });

	expect(result).toEqual({
		type: 'failure',
		error: 'Not enough clicks (you have 0, and need 15)'
	});
});

test('events are validated by addEvent', () => {
	const events: Events = [...new Array(15)].map(() => ({ type: 'click', timestamp: 0 }));
	const result = addEvent(events, { type: 'cursor', timestamp: 1000 });

	expect(result).toEqual({
		type: 'success',
		newState: [...events, { type: 'cursor', timestamp: 1000 }]
	});
});
