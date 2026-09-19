'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema'
import { authActionClient } from '@/lib/safe-action'
import { updateTaskSchema } from '@/lib/validators/task'

export const updateTask = authActionClient
    .inputSchema(updateTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .update(task)
            .set({
                title: parsedInput.title,
                description: parsedInput.description?.trim() || null,
                plannedTime: parsedInput.plannedTime || null,
            })
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id)
                )
            )

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/inbox')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
