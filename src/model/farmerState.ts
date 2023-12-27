import * as R from 'remeda';
export type FullState = {
	eventList: Event[];
};

export const eventTypes = ['click', 'peasant', 'squire'] as const;
export type EventType = (typeof eventTypes)[number];

export type NonClickEventType = Exclude<EventType, 'click'>;
export const nonClickEventTypes = eventTypes.filter(
	(eventType): eventType is NonClickEventType => eventType !== 'click'
);

export type Event = {
	type: EventType;
	timestamp: number;
};

const killsPerSecond: { [key in EventType]: number } = {
	click: 0,
	peasant: 0.1,
	squire: 0.5
};

export const deriveKills = (state: FullState, currentTime: number) => {
	const events = state.eventList.filter((event) => event.timestamp <= currentTime);

	const clickCount = events.filter((event) => event.type === 'click').length;

	const autoClickerKills = R.pipe(
		events,
		R.filter((x) => nonClickEventTypes.includes(x.type as NonClickEventType)),
		R.map(({ timestamp, type }) => ((currentTime - timestamp) / 1000) * killsPerSecond[type])
	).reduce((a, b) => a + b, 0);

	return clickCount + autoClickerKills;
};
