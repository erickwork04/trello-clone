import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm'

import { db } from '@/db'
import { focusSession, task } from '@/db/schema'

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
                lt(focusSession.startedAt, endOfDay),
                isNotNull(focusSession.endedAt)
            )
        )

    const [lastFocus] = await db
        .select({
            id: focusSession.id,
            taskId: focusSession.taskId,
            durationSeconds: focusSession.durationSeconds,
            endedAt: focusSession.endedAt,
            taskTitle: task.title,
        })
        .from(focusSession)
        .innerJoin(task, eq(focusSession.taskId, task.id))
        .where(
            and(
                eq(focusSession.userId, userId),
                gte(focusSession.startedAt, startOfDay),
                lt(focusSession.startedAt, endOfDay),
                isNotNull(focusSession.endedAt)
            )
        )
        .orderBy(desc(focusSession.endedAt))
        .limit(1)

    return {
        activeSession: activeSession ?? null,
        totalSeconds: Number(result?.totalSeconds ?? 0),
        lastFocus: lastFocus ?? null,
    }
}
