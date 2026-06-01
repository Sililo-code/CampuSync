import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '@/lib/constants';

/**
 * Centralised Zod validation schemas for CampuSync.
 *
 * All form validation schemas are defined here to avoid duplication
 * across components. Import the relevant schema in each form component.
 */

export const signInSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const signUpSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }).max(255),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  }),
  fullName: z.string().trim().min(1, { message: 'Full name is required.' }).max(100),
});

export const createUserSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required.' }).max(255),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  }),
  fullName: z.string().trim().min(1, { message: 'Full name is required.' }).max(100),
  role: z.enum(['student', 'lecturer'], {
    errorMap: () => ({ message: 'Role must be student or lecturer.' }),
  }),
});

export const createModuleSchema = z.object({
  code: z.string().trim().min(1, { message: 'Module code is required.' }).max(20),
  name: z.string().trim().min(1, { message: 'Module name is required.' }).max(100),
  description: z.string().max(500).optional(),
  attendanceThreshold: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(80),
});

export const createSessionSchema = z.object({
  moduleId: z.string().uuid({ message: 'A valid module must be selected.' }),
  sessionDate: z.string().min(1, { message: 'Session date is required.' }),
  startTime: z.string().min(1, { message: 'Start time is required.' }),
  topic: z.string().max(200).optional(),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type CreateModuleFormValues = z.infer<typeof createModuleSchema>;
export type CreateSessionFormValues = z.infer<typeof createSessionSchema>;
