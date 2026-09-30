import { z } from "zod";

export const loginFormSchema = z
  .object({
    email: z.string().trim().email("email"),
    password: z.string().min(1, "required"),
    turnstileToken: z.string().min(1, "turnstile"),
    /** Honeypot — must stay empty. */
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.website && data.website.length > 0) {
      ctx.addIssue({ code: "custom", message: "honeypot", path: ["website"] });
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("email"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
