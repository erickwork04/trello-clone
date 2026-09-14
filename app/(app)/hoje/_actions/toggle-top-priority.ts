'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'

export async function toggleTopPriority(taskId: string, currentValue: boolean) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    if (!currentValue) {
        const priorities = await db
            .select()
            .from(task)
            .where(
                and(
                    eq(task.userId, session.user.id),
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
        .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))

    revalidatePath('/hoje')
}
