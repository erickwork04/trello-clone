'use server'

import { headers } from 'next/headers'
import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { tag } from '@/db/schema/tag'
import { taskTag } from '@/db/schema/task-tag'

interface CreateInboxTaskInput {
    title: string
    description?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    plannedDate?: string
    tagIds?: string[]
}

interface UpdateInboxTaskInput {
    taskId: string
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    plannedDate?: string
    tagIds?: string[]
}

export async function updateInboxTask({
    taskId,
    title,
    description,
    priority,
    plannedDate,
    tagIds = [],
}: UpdateInboxTaskInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
        throw new Error('Informe o título da tarefa.')
    }

    const existingTask = await db
        .select({
            id: task.id,
        })
        .from(task)
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
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
            title: trimmedTitle,
            description: description?.trim() || null,
            priority,
            plannedDate: plannedDate
                ? new Date(`${plannedDate}T00:00:00`)
                : null,
        })
        .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))

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
                and(eq(tag.userId, session.user.id), inArray(tag.id, tagIds))
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
}

export async function deleteInboxTask(taskId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    await db
        .delete(task)
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )

    revalidatePath('/inbox')
}

export async function createInboxTask({
    title,
    description,
    priority = 'MEDIUM',
    plannedDate,
    tagIds = [],
}: CreateInboxTaskInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
        throw new Error('Informe o título da tarefa.')
    }

    const [createdTask] = await db
        .insert(task)
        .values({
            userId: session.user.id,
            title: trimmedTitle,
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
                and(eq(tag.userId, session.user.id), inArray(tag.id, tagIds))
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
}

export async function completeInboxTask(taskId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const [currentTask] = await db
        .select({
            id: task.id,
            completedAt: task.completedAt,
        })
        .from(task)
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )
        .limit(1)

    if (!currentTask) {
        throw new Error('Tarefa não encontrada.')
    }

    await db
        .update(task)
        .set({
            completedAt: currentTask.completedAt ? null : new Date(),
        })
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )

    revalidatePath('/inbox')
}

export async function moveInboxTask(
    taskId: string,
    inboxStage: 'ARRIVED' | 'ORGANIZE' | 'NEXT' | 'ORGANIZED'
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    await db
        .update(task)
        .set({
            inboxStage,
        })
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )

    revalidatePath('/inbox')
}
