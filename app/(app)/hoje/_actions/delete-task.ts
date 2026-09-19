'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema'
import { authActionClient } from '@/lib/safe-action'
import { taskIdSchema } from '@/lib/validators/task'

export const deleteTask = authActionClient
    .inputSchema(taskIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .delete(task)
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
