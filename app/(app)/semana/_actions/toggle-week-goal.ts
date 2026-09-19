'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { weekGoal } from '@/db/schema/week-goal'
import { authActionClient } from '@/lib/safe-action'
import { toggleWeekGoalSchema } from '@/lib/validators/week'

export const toggleWeekGoal = authActionClient
    .inputSchema(toggleWeekGoalSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .update(weekGoal)
            .set({
                completed: parsedInput.completed,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(weekGoal.id, parsedInput.goalId),
                    eq(weekGoal.userId, ctx.user.id)
                )
            )

        revalidatePath('/semana')
    })
