import { z } from 'zod'

const areaSchema = z.enum(['WORK', 'STUDIES', 'PERSONAL'])

export const createWeekPlanSchema = z.object({
    weekStart: z.string().min(1, 'Semana inválida.'),
    goals: z.array(z.string()).default([]),
    habits: z
        .array(
            z.object({
                title: z.string(),
                targetDays: z.number().int().min(1).max(7),
            })
        )
        .default([]),
})

export const createWeekTaskSchema = z.object({
    title: z.string().trim().min(1, 'O título da tarefa é obrigatório.'),
    area: areaSchema,
    plannedDate: z.string().min(1, 'Selecione uma data.'),
})

export const toggleHabitSchema = z.object({
    habitId: z.string().min(1, 'Hábito inválido.'),
    date: z.string().min(1, 'Data inválida.'),
})

export const toggleWeekGoalSchema = z.object({
    goalId: z.string().min(1, 'Meta inválida.'),
    completed: z.boolean(),
})
