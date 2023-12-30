import { z } from 'zod';
import { eventTypesSchema } from '../../../model/farmerState';

export const UserResponseSchema = z.object({
	id: z.string(),
	events: z.array(z.object({ timestamp: z.number(), type: eventTypesSchema }))
});
export type UserResponse = z.infer<typeof UserResponseSchema>;
