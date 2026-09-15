'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'

import { weekHabit } from '@/db/schema/week-habit'
import { weekHabitCheck } from '@/db/schema/week-habit-check'

interface ToggleHabitInput {
    habitId: string
    date: string
}

export async function toggleHabit(input: ToggleHabitInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    const habit = await db
        .select()
        .from(weekHabit)
        .where(
            and(
                eq(weekHabit.id, input.habitId),
                eq(weekHabit.userId, session.user.id)
            )
        )
        .limit(1)

    if (!habit.length) {
        throw new Error('Hábito não encontrado')
    }

    const [year, month, day] = input.date.split('-').map(Number)

    const date = new Date(year, month - 1, day)

    date.setHours(0, 0, 0, 0)

    const existing = await db
        .select()
        .from(weekHabitCheck)
        .where(
            and(
                eq(weekHabitCheck.habitId, input.habitId),
                eq(weekHabitCheck.date, date)
            )
        )
        .limit(1)

    if (existing.length > 0) {
        await db
            .delete(weekHabitCheck)
            .where(eq(weekHabitCheck.id, existing[0].id))
    } else {
        await db.insert(weekHabitCheck).values({
            habitId: input.habitId,
            date,
            completed: true,
        })
    }

    revalidatePath('/semana')
}
