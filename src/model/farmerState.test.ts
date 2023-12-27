import { expect, test } from 'vitest';
import { deriveKills, type FullState } from './farmerState';

test('clicks are correctly counted', () => {
	const fullState: FullState = {
		eventList: [
			{ type: 'click', timestamp: 0 },
			{ type: 'click', timestamp: 1000 },
			{ type: 'click', timestamp: 2000 },
			{ type: 'click', timestamp: 3000 }
		]
	};

	const result = deriveKills(fullState, 4000);

	expect(result).toBe(4);
});

test('peasant kills are correctly counted', () => {
	const fullState: FullState = {
		eventList: [{ type: 'peasant', timestamp: 0 }]
	};

	const result = deriveKills(fullState, 10000);

	expect(result).toBe(1);
});

test('peasant kills are correctly counted', () => {
	const fullState: FullState = {
		eventList: [
			{ type: 'peasant', timestamp: 0 },
			{ type: 'peasant', timestamp: 0 }
		]
	};

	const result = deriveKills(fullState, 10000);

	expect(result).toBe(2);
});

test('peasant + squire kills are correctly counted', () => {
	const fullState: FullState = {
		eventList: [
			{ type: 'peasant', timestamp: 0 },
			{ type: 'squire', timestamp: 1000 }
		]
	};

	expect(deriveKills(fullState, 0)).toBe(0);
	expect(deriveKills(fullState, 1000)).toBe(0.1);
	expect(deriveKills(fullState, 1500)).toBe(0.4);
	expect(deriveKills(fullState, 15000)).toBe(8.5);
});
