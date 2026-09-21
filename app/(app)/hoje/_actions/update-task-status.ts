'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { authActionClient } from '@/lib/safe-action'

/**
 * Move a task entre estados não-concluídos (BACKLOG/WEEK/TODAY/DOING).
 * Para marcar como concluída, usar `completeTask` (ele também seta
 * `completedAt`) — mantendo uma única fonte de verdade para conclusão.
 */
const updateTaskStatusSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    status: z.enum(['BACKLOG', 'WEEK', 'TODAY', 'DOING']),
})

export const updateTaskStatus = authActionClient
    .inputSchema(updateTaskStatusSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .update(task)
            .set({ status: parsedInput.status })
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id)
                )
            )

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
