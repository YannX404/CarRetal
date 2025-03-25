import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

export const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  phoneNumber: z.string().min(10, 'Numéro de téléphone invalide'),
});

export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});