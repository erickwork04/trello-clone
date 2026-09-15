import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm'

import { db } from '@/db'
import { focusSession } from '@/db/schema'

export async function getFocusData(userId: string) {
    const today = new Date()

    const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    )

    const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
    )

    const [activeSession] = await db
        .select()
        .from(focusSession)
        .where(
            and(eq(focusSession.userId, userId), isNull(focusSession.endedAt))
        )
        .limit(1)

    const [result] = await db
        .select({
            totalSeconds: sql<number>`
        coalesce(sum(${focusSession.durationSeconds}), 0)
      `,
        })
        .from(focusSession)
        .where(
            and(
                eq(focusSession.userId, userId),
                gte(focusSession.startedAt, startOfDay),
                lt(focusSession.startedAt, endOfDay)
            )
        )

    return {
        activeSession: activeSession ?? null,
        totalSeconds: Number(result?.totalSeconds ?? 0),
    }
}
