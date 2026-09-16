'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema'

interface UpdateTaskInput {
    taskId: string
    title: string
    description?: string
    plannedTime?: string
}

export async function updateTask(input: UpdateTaskInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    await db
        .update(task)
        .set({
            title: input.title.trim(),
            description: input.description?.trim() || null,
            plannedTime: input.plannedTime || null,
        })
        .where(and(eq(task.id, input.taskId), eq(task.userId, session.user.id)))

    revalidatePath('/hoje')
    revalidatePath('/semana')
    revalidatePath('/inbox')
    revalidatePath('/estudos')
    revalidatePath('/pessoal')
}
