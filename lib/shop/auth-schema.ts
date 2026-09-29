import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().email("email"),
  password: z.string().min(1, "required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("email"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
