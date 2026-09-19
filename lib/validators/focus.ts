import { z } from 'zod'

export const startFocusSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
})

export const focusSessionIdSchema = z.object({
    sessionId: z.string().min(1, 'Sessão de foco inválida.'),
})
