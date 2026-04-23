import { z } from 'zod'

export const signInSchema = z.object({
    email: z.email('E-mail inválido.'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
})

export const signUpSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    email: z.email('E-mail inválido.'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
})

export type SignInSchema = z.infer<typeof signInSchema>
export type SignUpSchema = z.infer<typeof signUpSchema>
