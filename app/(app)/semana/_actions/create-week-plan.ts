'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'

import { weekGoal } from '@/db/schema/week-goal'
import { weekHabit } from '@/db/schema/week-habit'
import { authActionClient } from '@/lib/safe-action'
import { createWeekPlanSchema } from '@/lib/validators/week'

export const createWeekPlan = authActionClient
    .inputSchema(createWeekPlanSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [year, month, day] = parsedInput.weekStart
            .split('-')
            .map(Number)

        const weekStart = new Date(year, month - 1, day)

        weekStart.setHours(0, 0, 0, 0)

        const goals = parsedInput.goals
            .map((goal) => goal.trim())
            .filter(Boolean)

        const habits = parsedInput.habits
            .map((habit) => ({
                title: habit.title.trim(),
                targetDays: habit.targetDays,
            }))
            .filter((habit) => habit.title)

        await db.transaction(async (tx) => {
            await tx
                .delete(weekGoal)
                .where(
                    and(
                        eq(weekGoal.userId, ctx.user.id),
                        eq(weekGoal.weekStart, weekStart)
                    )
                )

            await tx
                .delete(weekHabit)
                .where(
                    and(
                        eq(weekHabit.userId, ctx.user.id),
                        eq(weekHabit.weekStart, weekStart)
                    )
                )

            if (goals.length > 0) {
                await tx.insert(weekGoal).values(
                    goals.map((title) => ({
                        userId: ctx.user.id,
                        title,
                        weekStart,
                    }))
                )
            }

            if (habits.length > 0) {
                await tx.insert(weekHabit).values(
                    habits.map((habit) => ({
                        userId: ctx.user.id,
                        title: habit.title,
                        weekStart,
                        targetDays: habit.targetDays,
                    }))
                )
            }
        })

        revalidatePath('/semana')
    })
