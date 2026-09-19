'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { tag } from '@/db/schema/tag'
import { taskTag } from '@/db/schema/task-tag'
import { authActionClient } from '@/lib/safe-action'
import {
    createInboxTaskSchema,
    inboxTaskIdSchema,
    moveInboxTaskSchema,
    updateInboxTaskSchema,
} from '@/lib/validators/inbox'

export const createInboxTask = authActionClient
    .inputSchema(createInboxTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { title, description, priority, plannedDate, tagIds } =
            parsedInput

        const [createdTask] = await db
            .insert(task)
            .values({
                userId: ctx.user.id,
                title,
                description: description?.trim() || null,
                area: 'INBOX',
                status: 'BACKLOG',
                priority,
                plannedDate: plannedDate
                    ? new Date(`${plannedDate}T00:00:00`)
                    : null,
            })
            .returning({
                id: task.id,
            })

        if (tagIds.length > 0) {
            const validTags = await db
                .select({
                    id: tag.id,
                })
                .from(tag)
                .where(
                    and(
                        eq(tag.userId, ctx.user.id),
                        inArray(tag.id, tagIds)
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

        revalidatePath('/inbox')
    })

export const updateInboxTask = authActionClient
    .inputSchema(updateInboxTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { taskId, title, description, priority, plannedDate, tagIds } =
            parsedInput

        const existingTask = await db
            .select({
                id: task.id,
            })
            .from(task)
            .where(
                and(
                    eq(task.id, taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )
            .limit(1)

        if (existingTask.length === 0) {
            throw new Error('Tarefa não encontrada.')
        }

        await db
            .update(task)
            .set({
                title,
                description: description?.trim() || null,
                priority,
                plannedDate: plannedDate
                    ? new Date(`${plannedDate}T00:00:00`)
                    : null,
            })
            .where(and(eq(task.id, taskId), eq(task.userId, ctx.user.id)))

        // Remove as tags atuais da tarefa
        await db.delete(taskTag).where(eq(taskTag.taskId, taskId))

        // Adiciona novamente as tags selecionadas
        if (tagIds.length > 0) {
            const validTags = await db
                .select({
                    id: tag.id,
                })
                .from(tag)
                .where(
                    and(
                        eq(tag.userId, ctx.user.id),
                        inArray(tag.id, tagIds)
                    )
                )

            if (validTags.length > 0) {
                await db.insert(taskTag).values(
                    validTags.map((item) => ({
                        taskId,
                        tagId: item.id,
                    }))
                )
            }
        }

        revalidatePath('/inbox')
    })

export const deleteInboxTask = authActionClient
    .inputSchema(inboxTaskIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .delete(task)
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )

        revalidatePath('/inbox')
    })

export const completeInboxTask = authActionClient
    .inputSchema(inboxTaskIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [currentTask] = await db
            .select({
                id: task.id,
                completedAt: task.completedAt,
            })
            .from(task)
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )
            .limit(1)

        if (!currentTask) {
            throw new Error('Tarefa não encontrada.')
        }

        const isCompleting = !currentTask.completedAt

        await db
            .update(task)
            .set(
                isCompleting
                    ? { completedAt: new Date(), status: 'DONE' }
                    : { completedAt: null, status: 'BACKLOG' }
            )
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )

        revalidatePath('/inbox')
    })

export const moveInboxTask = authActionClient
    .inputSchema(moveInboxTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .update(task)
            .set({
                inboxStage: parsedInput.inboxStage,
            })
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )

        revalidatePath('/inbox')
    })
