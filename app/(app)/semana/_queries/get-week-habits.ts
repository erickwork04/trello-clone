import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { weekHabit } from '@/db/schema/week-habit'
import { weekHabitCheck } from '@/db/schema/week-habit-check'

export async function getWeekHabits(userId: string, weekStart: Date) {
    const habits = await db
        .select()
        .from(weekHabit)
        .where(
            and(
                eq(weekHabit.userId, userId),
                eq(weekHabit.weekStart, weekStart)
            )
        )
        .orderBy(asc(weekHabit.createdAt))

    return Promise.all(
        habits.map(async (habit) => {
            const checks = await db
                .select()
                .from(weekHabitCheck)
                .where(eq(weekHabitCheck.habitId, habit.id))
                .orderBy(asc(weekHabitCheck.date))

            return {
                ...habit,
                checks,
            }
        })
    )
}
