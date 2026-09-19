'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema'
import { authActionClient } from '@/lib/safe-action'
import { completeTaskSchema } from '@/lib/validators/task'

export const completeTask = authActionClient
    .inputSchema(completeTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { taskId, completed, returnStatus } = parsedInput

        if (completed) {
            // Já estava concluída → volta para o status anterior informado
            await db
                .update(task)
                .set({
                    status: returnStatus,
                    completedAt: null,
                })
                .where(
                    and(eq(task.id, taskId), eq(task.userId, ctx.user.id))
                )
        } else {
            // Ainda não concluída → conclui
            await db
                .update(task)
                .set({
                    status: 'DONE',
                    completedAt: new Date(),
                    isTopPriority: false,
                })
                .where(
                    and(eq(task.id, taskId), eq(task.userId, ctx.user.id))
                )
        }

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/board')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
