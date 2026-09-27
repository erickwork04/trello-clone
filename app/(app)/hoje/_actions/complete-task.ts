'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task, focusSession } from '@/db/schema'
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
            await db.transaction(async (tx) => {
                await tx
                    .update(task)
                    .set({
                        status: 'DONE',
                        completedAt: new Date(),
                        isTopPriority: false,
                    })
                    .where(
                        and(
                            eq(task.id, taskId),
                            eq(task.userId, ctx.user.id)
                        )
                    )

                // Se esta tarefa estava em foco (sessão ativa não
                // finalizada), encerra a sessão junto — sem isso, o
                // "Foco de hoje" ficaria com uma sessão órfã
                // apontando pra uma tarefa já concluída, e o usuário
                // não conseguiria escolher outro foco (a regra de
                // "só uma sessão ativa por vez" bloquearia).
                const [activeSession] = await tx
                    .select()
                    .from(focusSession)
                    .where(
                        and(
                            eq(focusSession.taskId, taskId),
                            eq(focusSession.userId, ctx.user.id),
                            isNull(focusSession.endedAt)
                        )
                    )
                    .limit(1)

                if (activeSession) {
                    const endedAt = new Date()

                    let durationSeconds = activeSession.accumulatedSeconds

                    if (!activeSession.pausedAt) {
                        durationSeconds += Math.max(
                            0,
                            Math.floor(
                                (endedAt.getTime() -
                                    activeSession.startedAt.getTime()) /
                                1000
                            )
                        )
                    }

                    await tx
                        .update(focusSession)
                        .set({
                            endedAt,
                            durationSeconds,
                            pausedAt: null,
                        })
                        .where(eq(focusSession.id, activeSession.id))
                }
            })
        }

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/board')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
