import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, "Email jest wymagany")
  .email("Nieprawidłowy format email");

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordConfirmSchema = z.object({
  accessToken: z.string().min(1, "Token jest wymagany"),
  newPassword: passwordSchema,
});