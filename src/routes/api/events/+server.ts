import db from '$lib/server/client';
import type { UnwrapPromise } from '@prisma/client/runtime/library';
import {
	addEvent,
	eventTypesSchema,
	type MuffinEvent,
	type AddEventResponse
} from '../../../model/farmerState';
import { z } from 'zod';

export type EventsResponse = UnwrapPromise<ReturnType<typeof db.event.findMany>>;

const createOrGetDefaultUser = async () => {
	const uniqueUser = await db.user.findUnique({ where: { id: 1 } });

	if (uniqueUser) {
		return uniqueUser;
	}

	const createResult = await db.user.create({
		data: { id: 1, name: 'default', email: 'example@example.com' }
	});
	return createResult;
};

const getEventsForUser = (user: { id: number }) =>
	db.event.findMany({ where: { userId: user.id } });

export async function GET() {
	const options: ResponseInit = {
		status: 200
	};
	const user = await createOrGetDefaultUser();
	const events = await getEventsForUser(user);

	return new Response(JSON.stringify(events), options);
}

export async function PUT({ request }) {
	const options: ResponseInit = {
		status: 200
	};

	const putSchema = z.object({ eventType: eventTypesSchema });
	const json = await putSchema.parseAsync(await request.json());
	const timestamp = new Date().getTime();

	const user = await createOrGetDefaultUser();

	const currentEvents = await getEventsForUser(user);

	const validatedEvents = currentEvents.map((x): MuffinEvent => {
		const parsedEventTypes = eventTypesSchema.safeParse(x.type);
		if (parsedEventTypes.success) {
			return { timestamp: x.timestamp.getTime(), type: parsedEventTypes.data };
		}
		throw new Error(`Failed parsing event: ${JSON.stringify(x)}`);
	});

	const eventsResult = addEvent(validatedEvents, { type: json.eventType, timestamp });

	if (eventsResult.type === 'failure') {
		return new Response(JSON.stringify(eventsResult), { status: 400 });
	}

	const latestEvent = eventsResult.newState.at(-1);

	if (!latestEvent) {
		const eventsResult: AddEventResponse = { type: 'failure', error: 'No latest event' };
		return new Response(JSON.stringify(eventsResult), { status: 400 });
	}

	try {
		await db.event.create({
			data: { timestamp: new Date(latestEvent.timestamp), type: latestEvent.type, userId: user.id }
		});
	} catch (e) {
		const eventsResult: AddEventResponse = { type: 'failure', error: 'Failed creating event' };
		return new Response(JSON.stringify(eventsResult), { status: 400 });
	}

	return new Response(JSON.stringify(eventsResult), options);
}
