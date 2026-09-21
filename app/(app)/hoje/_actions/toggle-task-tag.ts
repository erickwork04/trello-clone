'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { tag } from '@/db/schema/tag'
import { taskTag } from '@/db/schema/task-tag'
import { authActionClient } from '@/lib/safe-action'

const toggleTaskTagSchema = z.object({
    taskId: z.string().min(1, 'Tarefa inválida.'),
    tagId: z.string().min(1, 'Tag inválida.'),
    attach: z.boolean(),
})

export const toggleTaskTag = authActionClient
    .inputSchema(toggleTaskTagSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [ownedTask] = await db
            .select({ id: task.id })
            .from(task)
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id)
                )
            )
            .limit(1)

        if (!ownedTask) throw new Error('Tarefa não encontrada.')

        const [ownedTag] = await db
            .select({ id: tag.id })
            .from(tag)
            .where(
                and(
                    eq(tag.id, parsedInput.tagId),
                    eq(tag.userId, ctx.user.id)
                )
            )
            .limit(1)

        if (!ownedTag) throw new Error('Tag não encontrada.')

        if (parsedInput.attach) {
            await db
                .insert(taskTag)
                .values({
                    taskId: parsedInput.taskId,
                    tagId: parsedInput.tagId,
                })
                .onConflictDoNothing()
        } else {
            await db
                .delete(taskTag)
                .where(
                    and(
                        eq(taskTag.taskId, parsedInput.taskId),
                        eq(taskTag.tagId, parsedInput.tagId)
                    )
                )
        }

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
