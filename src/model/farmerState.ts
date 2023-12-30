import * as R from 'remeda';
import { z } from 'zod';
export type FullState = MuffinEvent[];

export const eventTypesSchema = z.union([
	z.literal('click'),
	z.literal('cursor'),
	z.literal('grandma'),
	z.literal('farm'),
	z.literal('mine'),
	z.literal('factory'),
	z.literal('bank'),
	z.literal('temple'),
	z.literal('wizard tower'),
	z.literal('shipment'),
	z.literal('alchemy lab'),
	z.literal('portal'),
	z.literal('time machine')
]);

export const eventTypes = eventTypesSchema.options.map((x) => x.value);
export type EventType = (typeof eventTypes)[number];

export type NonClickEventType = Exclude<EventType, 'click'>;
export const nonClickEventTypes = eventTypes.filter(
	(eventType): eventType is NonClickEventType => eventType !== 'click'
);

export const MuffinEventSchema = z.object({
	type: eventTypesSchema,
	timestamp: z.number()
});
export type MuffinEvent = z.TypeOf<typeof MuffinEventSchema>;

export type NonClickEvent = {
	type: NonClickEventType;
	timestamp: number;
};

const clicksPerSecond: { [key in EventType]: number } = {
	click: 0,
	cursor: 0.1,
	grandma: 1,
	farm: 8,
	mine: 47,
	factory: 260,
	bank: 1400,
	temple: 7800,
	'wizard tower': 44000,
	shipment: 260000,
	'alchemy lab': 1.6e6,
	portal: 10e6,
	'time machine': 65e6
};

const baseCosts: { [key in EventType]: number } = {
	click: 0,
	cursor: 15,
	grandma: 100,
	farm: 1100,
	mine: 12000,
	factory: 130000,
	bank: 1.4e6,
	temple: 20e6,
	'wizard tower': 330e6,
	shipment: 5.1e9,
	'alchemy lab': 75e9,
	portal: 1e12,
	'time machine': 14e12
};

export const getCost = (type: NonClickEventType, count: number) =>
	Math.ceil(baseCosts[type] * Math.pow(costIncreaseFactor, Math.max(count, 0)));

const costIncreaseFactor = 1.15;

export const AddEventResponseSchema = z.union([
	z.object({
		type: z.literal('success'),
		newState: z.array(MuffinEventSchema)
	}),
	z.object({
		type: z.literal('failure'),
		error: z.string()
	})
]);

export type AddEventResponse = z.infer<typeof AddEventResponseSchema>;
export const addEvent = (state: FullState, event: MuffinEvent): AddEventResponse => {
	if (nonClickEventTypes.includes(event.type as NonClickEventType)) {
		// validate cost
		const cost = getCost(
			event.type as NonClickEventType,
			state.filter((x) => x.type === event.type).length
		);
		const currentValue = getCountAtTime(state, event.timestamp);
		if (currentValue < cost) {
			return {
				type: 'failure',
				error: `Not enough clicks (you have ${Math.floor(currentValue)}, and need ${cost})`
			};
		}
	}

	return { type: 'success', newState: [...state, event] };
};

export const getCosts = (state: FullState): { [type in NonClickEventType]: number } => {
	const counts = R.mapValues(
		R.groupBy(state, (event) => event.type),
		(x) => x.length
	);
	return R.mapToObj(nonClickEventTypes, (type) => [type, getCost(type, counts[type] ?? 0)]);
};

export const getCostsAtTime = (events: FullState) => {
	const autoClickerCosts = R.pipe(
		events,
		R.filter((x): x is NonClickEvent => nonClickEventTypes.includes(x.type as NonClickEventType)),
		R.groupBy((x) => x.type),
		R.values,
		R.map((e) => R.reduce.indexed(e, (acc, val, index) => acc + getCost(val.type, index), 0)),
		R.reduce((a, b) => a + b, 0)
	);
	return autoClickerCosts;
};

export const getProductionAtTime = (events: FullState, currentTime: number): number => {
	const clickCount = events.filter((event) => event.type === 'click').length;

	const autoClickerclicks = R.pipe(
		events,
		R.filter((x) => nonClickEventTypes.includes(x.type as NonClickEventType)),
		R.map(({ timestamp, type }) =>
			Math.max(((currentTime - timestamp) / 1000) * clicksPerSecond[type], 0)
		)
	).reduce((a, b) => a + b, 0);
	return clickCount + autoClickerclicks;
};

export const getCountAtTime = (state: FullState, currentTime: number): number => {
	return getProductionAtTime(state, currentTime) - getCostsAtTime(state);
};
