import { z } from "zod"

export const LoginFormSchema = z.object({
	domain: z.string().min(1).max(255).trim().toLowerCase(),
	password: z
		.string()
		.min(1)
		.trim(),
})

export type LoginFormState =
	| {
			errors?: {
				domain?: string[]
				password?: string[]
			}
			message?: string
		}
	| undefined