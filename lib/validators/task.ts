import { z } from 'zod'

export const taskIdSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
})

const taskTitleSchema = z
    .string()
    .trim()
    .min(1, 'O título da tarefa é obrigatório.')

const taskAreaSchema = z.enum(['WORK', 'STUDIES', 'PERSONAL'])
const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

/**
 * Duas variantes: enviar para o Inbox (sem área/prioridade/data) ou
 * direto para Hoje/Semana (exige área, prioridade e data planejada).
 * Substitui a checagem manual `if (!input.area || ...) throw` do
 * arquivo original por validação declarativa.
 */
export const createTaskSchema = z.discriminatedUnion('destination', [
    z.object({
        destination: z.literal('INBOX'),
        title: taskTitleSchema,
        description: z.string().optional(),
    }),
    z.object({
        destination: z.literal('TODAY'),
        title: taskTitleSchema,
        description: z.string().optional(),
        area: taskAreaSchema,
        priority: taskPrioritySchema,
        plannedDate: z.string().min(1, 'Selecione uma data.'),
        plannedTime: z.string().optional(),
    }),
])

export const updateTaskSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    title: taskTitleSchema,
    description: z.string().optional(),
    plannedTime: z.string().optional(),
})

export const completeTaskSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    completed: z.boolean(),
    returnStatus: z
        .enum(['TODAY', 'BACKLOG', 'WEEK', 'DOING'])
        .default('TODAY'),
})

export const toggleTopPrioritySchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    currentValue: z.boolean(),
})
