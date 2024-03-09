import db from '$lib/server/client';
import type { UnwrapPromise } from '@prisma/client/runtime/library';
import {
	eventTypesSchema,
	foldEvents,
	calculateNewState,
	type MuffinEvent
} from '../../../model/farmerState';
import { z } from 'zod';
import type { UserResponse } from './types';
import type { AddEventResponse } from '../../../model/farmerState';

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
		state: foldEvents(
			uniqueUser.events.map((event) => ({
				timestamp: event.timestamp.getTime(),
				type: eventTypesSchema.parse(event.type)
			}))
		)
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

		const currentState = user.state;

		const newEvent: MuffinEvent = { timestamp, type: json.eventType };
		const newState = calculateNewState(currentState, newEvent);

		try {
			await client.event.create({
				data: {
					timestamp: new Date(newEvent.timestamp),
					type: newEvent.type,
					userId: user.id
				}
			});
			return { type: 'success' as const, newState };
		} catch (e) {
			const eventsResult: AddEventResponse = { type: 'failure', error: 'Failed creating event' };
			throw eventsResult;
		}
	});

	return new Response(JSON.stringify(result), {
		status: result.type === 'success' ? 200 : 400
	});
}
