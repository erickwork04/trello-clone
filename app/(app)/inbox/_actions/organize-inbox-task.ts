'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'

type Destination =
    | 'TODAY_WORK'
    | 'TODAY_STUDIES'
    | 'TODAY_PERSONAL'
    | 'WORK'
    | 'STUDIES'
    | 'PERSONAL'

export async function organizeInboxTask(
    taskId: string,
    destination: Destination
) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const values = {
        TODAY_WORK: {
            area: 'WORK' as const,
            status: 'TODAY' as const,
            plannedDate: today,
        },

        TODAY_STUDIES: {
            area: 'STUDIES' as const,
            status: 'TODAY' as const,
            plannedDate: today,
        },

        TODAY_PERSONAL: {
            area: 'PERSONAL' as const,
            status: 'TODAY' as const,
            plannedDate: today,
        },

        WORK: {
            area: 'WORK' as const,
            status: 'BACKLOG' as const,
            plannedDate: null,
        },

        STUDIES: {
            area: 'STUDIES' as const,
            status: 'BACKLOG' as const,
            plannedDate: null,
        },

        PERSONAL: {
            area: 'PERSONAL' as const,
            status: 'BACKLOG' as const,
            plannedDate: null,
        },
    }

    await db
        .update(task)
        .set(values[destination])
        .where(
            and(
                eq(task.id, taskId),
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )

    revalidatePath('/inbox')
    revalidatePath('/hoje')
    revalidatePath('/semana')
}
