'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { authActionClient } from '@/lib/safe-action'
import { toggleTopPrioritySchema } from '@/lib/validators/task'

export const toggleTopPriority = authActionClient
    .inputSchema(toggleTopPrioritySchema)
    .action(async ({ parsedInput, ctx }) => {
        const { taskId, currentValue } = parsedInput

        if (!currentValue) {
            const priorities = await db
                .select()
                .from(task)
                .where(
                    and(
                        eq(task.userId, ctx.user.id),
                        eq(task.status, 'TODAY'),
                        eq(task.isTopPriority, true)
                    )
                )

            if (priorities.length >= 3) {
                throw new Error('Você já possui 3 prioridades para hoje.')
            }
        }

        await db
            .update(task)
            .set({
                isTopPriority: !currentValue,
            })
            .where(
                and(eq(task.id, taskId), eq(task.userId, ctx.user.id))
            )

        revalidatePath('/hoje')
    })
