'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'

export async function completeTask(taskId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    await db
        .update(task)
        .set({
            status: 'DONE',
            completedAt: new Date(),
            isTopPriority: false,
        })
        .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))

    revalidatePath('/hoje')
}
