'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { taskTag } from '@/db/schema/task-tag'
import { tag } from '@/db/schema/tag'
import { authActionClient } from '@/lib/safe-action'
import { createTaskSchema } from '@/lib/validators/task'

export const createTask = authActionClient
    .inputSchema(createTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (parsedInput.destination === 'INBOX') {
            await db.insert(task).values({
                userId: ctx.user.id,
                title: parsedInput.title,
                description: parsedInput.description?.trim() || null,
                area: 'INBOX',
                status: 'BACKLOG',
                priority: 'MEDIUM',
                plannedDate: null,
                plannedTime: null,
            })

            revalidatePath('/hoje')
            revalidatePath('/inbox')

            return
        }

        const [year, month, day] = parsedInput.plannedDate
            .split('-')
            .map(Number)

        const plannedDate = new Date(year, month - 1, day)

        const today = new Date()

        today.setHours(0, 0, 0, 0)
        plannedDate.setHours(0, 0, 0, 0)

        const isToday = plannedDate.getTime() === today.getTime()

        const [createdTask] = await db
            .insert(task)
            .values({
                userId: ctx.user.id,
                title: parsedInput.title,
                description: parsedInput.description?.trim() || null,
                area: parsedInput.area,
                priority: parsedInput.priority,
                status: isToday ? 'TODAY' : 'WEEK',
                plannedDate,
                plannedTime: parsedInput.plannedTime || null,
                estimatedMinutes: parsedInput.estimatedMinutes ?? null,
            })
            .returning({ id: task.id })

        if (parsedInput.tagIds && parsedInput.tagIds.length > 0) {
            const validTags = await db
                .select({ id: tag.id })
                .from(tag)
                .where(
                    and(
                        eq(tag.userId, ctx.user.id),
                        inArray(tag.id, parsedInput.tagIds)
                    )
                )

            if (validTags.length > 0) {
                await db.insert(taskTag).values(
                    validTags.map((item) => ({
                        taskId: createdTask.id,
                        tagId: item.id,
                    }))
                )
            }
        }

        revalidatePath('/hoje')
        revalidatePath('/semana')
        revalidatePath('/estudos')
        revalidatePath('/pessoal')
    })
