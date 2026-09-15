'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { focusSession } from '@/db/schema'

export async function startFocus(taskId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    const activeSession = await db
        .select()
        .from(focusSession)
        .where(
            and(
                eq(focusSession.userId, session.user.id),
                isNull(focusSession.endedAt)
            )
        )
        .limit(1)

    if (activeSession.length > 0) {
        return activeSession[0]
    }

    const [createdSession] = await db
        .insert(focusSession)
        .values({
            userId: session.user.id,
            taskId,
        })
        .returning()

    return createdSession
}
