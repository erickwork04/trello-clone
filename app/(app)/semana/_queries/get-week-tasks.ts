import { and, asc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/db'
import { task } from '@/db/schema/task'

export async function getWeekTasks(userId: string, start: Date, end: Date) {
    return db
        .select()
        .from(task)
        .where(
            and(
                eq(task.userId, userId),
                gte(task.plannedDate, start),
                lte(task.plannedDate, end)
            )
        )
        .orderBy(asc(task.plannedDate), asc(task.position))
}
