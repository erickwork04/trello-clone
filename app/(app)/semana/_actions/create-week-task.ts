'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { authActionClient } from '@/lib/safe-action'
import { createWeekTaskSchema } from '@/lib/validators/week'

export const createWeekTask = authActionClient
    .inputSchema(createWeekTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [year, month, day] = parsedInput.plannedDate
            .split('-')
            .map(Number)

        const plannedDate = new Date(year, month - 1, day)

        plannedDate.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const isToday = plannedDate.getTime() === today.getTime()

        await db.insert(task).values({
            userId: ctx.user.id,
            title: parsedInput.title,
            area: parsedInput.area,
            priority: 'MEDIUM',
            status: isToday ? 'TODAY' : 'WEEK',
            plannedDate,
        })

        revalidatePath('/semana')
        revalidatePath('/hoje')
    })
