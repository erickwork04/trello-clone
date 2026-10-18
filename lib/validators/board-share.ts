import { z } from 'zod'

const id = z.string().trim().min(1).max(200)

export const boardShareInputSchema = z.object({ boardId: id })

export const publicBoardTokenSchema = z
    .string()
    .regex(/^[A-Za-z0-9_-]{43}$/, 'Token de compartilhamento inválido.')

export const publicObservationInputSchema = z.object({
    visitorName: z.string().trim().max(80, 'O nome deve ter até 80 caracteres.').optional(),
    content: z
        .string()
        .trim()
        .min(1, 'Escreva uma observação antes de enviar.')
        .max(2000, 'A observação deve ter até 2.000 caracteres.'),
})

export const observationIdSchema = z.object({ id: id })

export const observationUpdateSchema = z.object({
    id,
    content: z.string().trim().min(1, 'Escreva uma observação antes de salvar.').max(2000, 'A observação deve ter até 2.000 caracteres.'),
})

export const publicObservationUpdateSchema = observationUpdateSchema.pick({ content: true })
