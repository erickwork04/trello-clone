'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema'

type ReturnStatus = 'TODAY' | 'BACKLOG' | 'WEEK' | 'DOING'

export async function completeTask(
    taskId: string,
    completed: boolean,
    returnStatus: ReturnStatus = 'TODAY'
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    if (completed) {
        // Já estava concluída → volta para o status anterior informado
        await db
            .update(task)
            .set({
                status: returnStatus,
                completedAt: null,
            })
            .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    } else {
        // Ainda não concluída → conclui
        await db
            .update(task)
            .set({
                status: 'DONE',
                completedAt: new Date(),
                isTopPriority: false,
            })
            .where(and(eq(task.id, taskId), eq(task.userId, session.user.id)))
    }

    revalidatePath('/hoje')
    revalidatePath('/semana')
    revalidatePath('/board')
    revalidatePath('/estudos')
    revalidatePath('/pessoal')
}
