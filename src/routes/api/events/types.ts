import { z } from 'zod';
import { MuffinStateSchema } from '../../../model/farmerState';

export const UserResponseSchema = z.object({
	id: z.string(),
	state: MuffinStateSchema
});
export type UserResponse = z.infer<typeof UserResponseSchema>;
