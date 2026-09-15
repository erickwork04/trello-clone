import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { weekGoal } from '@/db/schema/week-goal'

export async function getWeekGoals(userId: string, weekStart: Date) {
    return db
        .select()
        .from(weekGoal)
        .where(
            and(eq(weekGoal.userId, userId), eq(weekGoal.weekStart, weekStart))
        )
        .orderBy(asc(weekGoal.createdAt))
}
