import { expect, test } from 'vitest';
import { type Events, getCosts, foldEvents, calculateNewState } from './farmerState';

test('clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'click', timestamp: 0 },
		{ type: 'click', timestamp: 1000 },
		{ type: 'click', timestamp: 2000 },
		{ type: 'click', timestamp: 3000 }
	];
	const result = foldEvents(events);

	expect(result.count).toBe(4);
});

test("clicks aren't counted negatively", () => {
	const events: Events = [{ type: 'grandma', timestamp: 1000 }];
	const result = foldEvents(events);

	expect(result.rate).toBe(0);
});

test('grandma clicks are correctly counted', () => {
	const event = { type: 'grandma', timestamp: 0 } as const;
	const result = calculateNewState({ count: 100, rate: 0, countTimestamp: 0, events: [] }, event);

	expect(result.count).toBe(0);
	expect(result.rate).toBe(1);
});

test('double grandma clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'grandma', timestamp: 0 },
		{ type: 'grandma', timestamp: 0 }
	];
	const result = foldEvents(events, { count: 215, countTimestamp: 0, events: [], rate: 0 });

	expect(result.count).toBe(0);
	expect(result.rate).toBe(2);
});

test('grandma + factory clicks are correctly counted', () => {
	const events: Events = [
		{ type: 'cursor', timestamp: 0 },
		{ type: 'grandma', timestamp: 2000 }
	];

	const initialState = { count: 500, rate: 0, countTimestamp: 0, events: [] };
	const afterFirstEvent = calculateNewState(initialState, events[0]);
	expect(afterFirstEvent.events).toStrictEqual([events[0]]);
	expect(afterFirstEvent.count).toBe(485);
	expect(afterFirstEvent.rate).toBe(0.1);

	const afterSecondEvent = calculateNewState(afterFirstEvent, events[1]);
	expect(afterSecondEvent.count).toBe(385.2);
	expect(afterSecondEvent.rate).toBe(1.1);
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

/*
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

*/
