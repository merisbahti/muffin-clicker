import db from '$lib/server/client';
import type { UnwrapPromise } from '@prisma/client/runtime/library';
import { addEvent, eventTypesSchema, type AddEventResponse } from '../../../model/farmerState';
import { z } from 'zod';
import type { UserResponse } from './types';

export type EventsResponse = UnwrapPromise<ReturnType<typeof db.event.findMany>>;

type MinimalPrismaClient = Omit<
	typeof db,
	'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const getOrCreateUser = async (
	userId: string | null,
	client: MinimalPrismaClient
): Promise<UserResponse> => {
	const uniqueUser =
		(userId
			? await client.user.findUnique({
					where: { id: userId },
					include: { events: true }
				})
			: null) ??
		(await client.user.create({
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
	const user: UserResponse = await getOrCreateUser(userId, db);

	return new Response(JSON.stringify(user), options);
}

export async function PUT(context: { request: Request }) {
	const userId = context.request.headers.get('x-user-id') ?? null;

	const putSchema = z.object({ eventType: eventTypesSchema });
	const json = await putSchema.parseAsync(await context.request.json());
	const timestamp = new Date().getTime();

	const result: AddEventResponse = await db.$transaction(async (client) => {
		const user = await getOrCreateUser(userId, client);

		const currentEvents = user.events;

		const eventsResult = addEvent(currentEvents, { type: json.eventType, timestamp });

		if (eventsResult.type === 'failure') {
			throw eventsResult;
		}

		const latestEvent = eventsResult.newState.at(-1);

		if (!latestEvent) {
			const eventsResult: AddEventResponse = { type: 'failure', error: 'No latest event' };
			throw eventsResult;
		}

		try {
			await client.event.create({
				data: {
					timestamp: new Date(latestEvent.timestamp),
					type: latestEvent.type,
					userId: user.id
				}
			});
		} catch (e) {
			const eventsResult: AddEventResponse = { type: 'failure', error: 'Failed creating event' };
			throw eventsResult;
		}

		return eventsResult;
	});

	return new Response(JSON.stringify(result), {
		status: result.type === 'success' ? 200 : 400
	});
}
