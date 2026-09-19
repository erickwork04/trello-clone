'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'

import { weekHabit } from '@/db/schema/week-habit'
import { weekHabitCheck } from '@/db/schema/week-habit-check'
import { authActionClient } from '@/lib/safe-action'
import { toggleHabitSchema } from '@/lib/validators/week'

export const toggleHabit = authActionClient
    .inputSchema(toggleHabitSchema)
    .action(async ({ parsedInput, ctx }) => {
        const habit = await db
            .select()
            .from(weekHabit)
            .where(
                and(
                    eq(weekHabit.id, parsedInput.habitId),
                    eq(weekHabit.userId, ctx.user.id)
                )
            )
            .limit(1)

        if (!habit.length) {
            throw new Error('Hábito não encontrado')
        }

        const [year, month, day] = parsedInput.date.split('-').map(Number)

        const date = new Date(year, month - 1, day)

        date.setHours(0, 0, 0, 0)

        await db.transaction(async (tx) => {
            const existing = await tx
                .select()
                .from(weekHabitCheck)
                .where(
                    and(
                        eq(weekHabitCheck.habitId, parsedInput.habitId),
                        eq(weekHabitCheck.date, date)
                    )
                )
                .limit(1)

            if (existing.length > 0) {
                await tx
                    .delete(weekHabitCheck)
                    .where(eq(weekHabitCheck.id, existing[0].id))
            } else {
                await tx.insert(weekHabitCheck).values({
                    habitId: parsedInput.habitId,
                    date,
                    completed: true,
                })
            }
        })

        revalidatePath('/semana')
    })
