import { z } from 'zod'

export const addToWaitlistSchema = z.object({
    name: z.string().trim().min(1, 'Informe seu nome.'),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, 'Informe seu e-mail.')
        .email('Informe um e-mail válido.'),
    phone: z.string().trim().min(1, 'Informe seu WhatsApp.'),
})
