import { z } from 'zod'

const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const organizeInboxTaskSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    destination: z.enum([
        'TODAY_WORK',
        'TODAY_STUDIES',
        'TODAY_PERSONAL',
        'WORK',
        'STUDIES',
        'PERSONAL',
    ]),
})

export const createInboxTaskSchema = z.object({
    title: z.string().trim().min(1, 'Informe o título da tarefa.'),
    description: z.string().optional(),
    priority: prioritySchema.default('MEDIUM'),
    plannedDate: z.string().optional(),
    tagIds: z.array(z.string()).default([]),
})

export const updateInboxTaskSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    title: z.string().trim().min(1, 'Informe o título da tarefa.'),
    description: z.string().optional(),
    priority: prioritySchema,
    plannedDate: z.string().optional(),
    tagIds: z.array(z.string()).default([]),
})

export const inboxTaskIdSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
})

export const moveInboxTaskSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    inboxStage: z.enum(['ARRIVED', 'ORGANIZE', 'NEXT', 'ORGANIZED']),
})
