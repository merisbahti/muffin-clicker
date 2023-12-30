import db from '$lib/server/client';
import type { UnwrapPromise } from '@prisma/client/runtime/library';
import { addEvent, eventTypesSchema, type AddEventResponse } from '../../../model/farmerState';
import { z } from 'zod';
import type { UserResponse } from './types';

export type EventsResponse = UnwrapPromise<ReturnType<typeof db.event.findMany>>;

const getOrCreateUser = async (userId: string | null): Promise<UserResponse> => {
	const uniqueUser =
		(userId
			? await db.user.findUnique({
					where: { id: userId },
					include: { events: true }
				})
			: null) ??
		(await db.user.create({
			data: {},
			include: { events: true }
		}));

	const formatUserResponse: UserResponse = {
		id: uniqueUser.id,
		events: uniqueUser.events.map((event) => ({
			timestamp: event.timestamp.getTime(),
			type: eventTypesSchema.parse(event.type)
		}))
	};

	return formatUserResponse;
};

export async function GET(context: { request: Request }) {
	const userId = context.request.headers.get('x-user-id') ?? null;
	const options: ResponseInit = {
		status: 200
	};
	const user: UserResponse = await getOrCreateUser(userId);

	return new Response(JSON.stringify(user), options);
}

export async function PUT(context: { request: Request }) {
	const userId = context.request.headers.get('x-user-id') ?? null;
	const options: ResponseInit = {
		status: 200
	};

	const putSchema = z.object({ eventType: eventTypesSchema });
	const json = await putSchema.parseAsync(await context.request.json());
	const timestamp = new Date().getTime();

	const user = await getOrCreateUser(userId);

	const currentEvents = user.events;

	const eventsResult = addEvent(currentEvents, { type: json.eventType, timestamp });

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
