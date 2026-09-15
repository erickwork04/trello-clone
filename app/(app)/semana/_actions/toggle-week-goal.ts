'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { weekGoal } from '@/db/schema/week-goal'

export async function toggleWeekGoal(goalId: string, completed: boolean) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    await db
        .update(weekGoal)
        .set({
            completed,
            updatedAt: new Date(),
        })
        .where(
            and(eq(weekGoal.id, goalId), eq(weekGoal.userId, session.user.id))
        )

    revalidatePath('/semana')
}
