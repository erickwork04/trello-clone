import { z } from 'zod'

export const cardNameSchema = z
    .string()
    .min(1, 'O nome é obrigatório.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.')

export const cardIdSchema = z.object({
    cardId: z.string().min(1, 'Card inválido.'),
})

export const updateCardDetailsSchema = z.object({
    cardId: z.string().min(1, 'Card inválido.'),
    description: z.string().max(4000).nullable().optional(),
    dueDate: z.string().nullable().optional(),
})

export const toggleCardTagSchema = z.object({
    cardId: z.string().min(1, 'Card inválido.'),
    tagId: z.string().min(1, 'Tag inválida.'),
    attach: z.boolean(),
})

export const checklistItemTitleSchema = z
    .string()
    .trim()
    .min(1, 'O item não pode ficar vazio.')
    .max(200, 'O item deve ter no máximo 200 caracteres.')

export const createChecklistItemSchema = z.object({
    cardId: z.string().min(1, 'Card inválido.'),
    title: checklistItemTitleSchema,
})

export const toggleChecklistItemSchema = z.object({
    id: z.string().min(1, 'Item inválido.'),
    completed: z.boolean(),
})

export const deleteChecklistItemSchema = z.object({
    id: z.string().min(1, 'Item inválido.'),
})
