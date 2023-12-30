import * as R from 'remeda';
export type FullState = Event[];

export const eventTypes = ['click', 'grandma', 'factory'] as const;
export type EventType = (typeof eventTypes)[number];

export type NonClickEventType = Exclude<EventType, 'click'>;
export const nonClickEventTypes = eventTypes.filter(
	(eventType): eventType is NonClickEventType => eventType !== 'click'
);

export type Event = {
	type: EventType;
	timestamp: number;
};

export type NonClickEvent = {
	type: NonClickEventType;
	timestamp: number;
};

const clicksPerSecond: { [key in EventType]: number } = {
	click: 0,
	grandma: 0.1,
	factory: 0.5
};

const baseCosts: { [key in EventType]: number } = {
	click: 0,
	grandma: 15,
	factory: 100
};

export const getCost = (type: NonClickEventType, count: number) =>
	Math.ceil(baseCosts[type] * Math.pow(costIncreaseFactor, Math.max(count, 0)));

const costIncreaseFactor = 1.15;

export const addEvent = (
	state: FullState,
	event: Event
): { type: 'success'; newState: FullState } | { type: 'failure'; error: string } => {
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
