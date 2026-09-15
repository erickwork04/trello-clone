'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'

import { weekGoal } from '@/db/schema/week-goal'
import { weekHabit } from '@/db/schema/week-habit'

interface CreateWeekPlanInput {
    weekStart: string

    goals: string[]

    habits: {
        title: string
        targetDays: number
    }[]
}

export async function createWeekPlan(input: CreateWeekPlanInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    const [year, month, day] = input.weekStart.split('-').map(Number)

    const weekStart = new Date(year, month - 1, day)

    weekStart.setHours(0, 0, 0, 0)

    const goals = input.goals.map((goal) => goal.trim()).filter(Boolean)

    const habits = input.habits
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
                    eq(weekGoal.userId, session.user.id),
                    eq(weekGoal.weekStart, weekStart)
                )
            )

        await tx
            .delete(weekHabit)
            .where(
                and(
                    eq(weekHabit.userId, session.user.id),
                    eq(weekHabit.weekStart, weekStart)
                )
            )

        if (goals.length > 0) {
            await tx.insert(weekGoal).values(
                goals.map((title) => ({
                    userId: session.user.id,
                    title,
                    weekStart,
                }))
            )
        }

        if (habits.length > 0) {
            await tx.insert(weekHabit).values(
                habits.map((habit) => ({
                    userId: session.user.id,
                    title: habit.title,
                    weekStart,
                    targetDays: habit.targetDays,
                }))
            )
        }
    })

    revalidatePath('/semana')
}
