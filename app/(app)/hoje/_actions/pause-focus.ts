'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { focusSession } from '@/db/schema'

export async function pauseFocus(sessionId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    const [focus] = await db
        .select()
        .from(focusSession)
        .where(
            and(
                eq(focusSession.id, sessionId),
                eq(focusSession.userId, session.user.id),
                isNull(focusSession.endedAt)
            )
        )
        .limit(1)

    if (!focus || focus.pausedAt) {
        return
    }

    const now = new Date()

    const currentSeconds = Math.max(
        0,
        Math.floor((now.getTime() - focus.startedAt.getTime()) / 1000)
    )

    await db
        .update(focusSession)
        .set({
            pausedAt: now,
            accumulatedSeconds: focus.accumulatedSeconds + currentSeconds,
        })
        .where(eq(focusSession.id, sessionId))

    revalidatePath('/hoje')
}
