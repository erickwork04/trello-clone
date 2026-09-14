import { and, asc, eq, gte, lt } from 'drizzle-orm'

import { db } from '@/db'
import { task } from '@/db/schema/task'

export async function getTodayData(userId: string) {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

    const todayTasks = await db
        .select()
        .from(task)
        .where(and(eq(task.userId, userId), eq(task.status, 'TODAY')))
        .orderBy(asc(task.position), asc(task.createdAt))

    const completedToday = await db
        .select()
        .from(task)
        .where(
            and(
                eq(task.userId, userId),
                eq(task.status, 'DONE'),
                gte(task.completedAt, startOfToday),
                lt(task.completedAt, startOfTomorrow)
            )
        )
        .orderBy(asc(task.completedAt))

    const topPriorities = todayTasks
        .filter((item) => item.isTopPriority)
        .slice(0, 3)

    const completedCount = completedToday.length
    const pendingCount = todayTasks.length

    const totalCount = completedCount + pendingCount

    return {
        todayTasks,
        completedToday,
        topPriorities,
        completedCount,
        pendingCount,
        totalCount,
    }
}
