'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { focusSession, task } from '@/db/schema'
import { authActionClient } from '@/lib/safe-action'
import { startFocusSchema } from '@/lib/validators/focus'

export const startFocus = authActionClient
    .inputSchema(startFocusSchema)
    .action(async ({ parsedInput, ctx }) => {
        const createdSession = await db.transaction(async (tx) => {
            const [ownedTask] = await tx
                .select({ id: task.id })
                .from(task)
                .where(
                    and(
                        eq(task.id, parsedInput.taskId),
                        eq(task.userId, ctx.user.id)
                    )
                )
                .limit(1)

            if (!ownedTask) {
                throw new Error('Tarefa não encontrada.')
            }

            const activeSession = await tx
                .select()
                .from(focusSession)
                .where(
                    and(
                        eq(focusSession.userId, ctx.user.id),
                        isNull(focusSession.endedAt)
                    )
                )
                .limit(1)

            if (activeSession.length > 0) {
                return activeSession[0]
            }

            const [inserted] = await tx
                .insert(focusSession)
                .values({
                    userId: ctx.user.id,
                    taskId: parsedInput.taskId,
                })
                .returning()

            return inserted
        })

        revalidatePath('/hoje')

        return createdSession
    })
