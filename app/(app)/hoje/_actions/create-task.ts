'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { authActionClient } from '@/lib/safe-action'
import { createTaskSchema } from '@/lib/validators/task'

export const createTask = authActionClient
    .inputSchema(createTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (parsedInput.destination === 'INBOX') {
            await db.insert(task).values({
                userId: ctx.user.id,
                title: parsedInput.title,
                description: parsedInput.description?.trim() || null,
                area: 'INBOX',
                status: 'BACKLOG',
                priority: 'MEDIUM',
                plannedDate: null,
                plannedTime: null,
            })

            revalidatePath('/hoje')
            revalidatePath('/inbox')

            return
        }

        const [year, month, day] = parsedInput.plannedDate
            .split('-')
            .map(Number)

        const plannedDate = new Date(year, month - 1, day)

        const today = new Date()

        today.setHours(0, 0, 0, 0)
        plannedDate.setHours(0, 0, 0, 0)

        const isToday = plannedDate.getTime() === today.getTime()

        await db.insert(task).values({
            userId: ctx.user.id,
            title: parsedInput.title,
            description: parsedInput.description?.trim() || null,
            area: parsedInput.area,
            priority: parsedInput.priority,
            status: isToday ? 'TODAY' : 'WEEK',
            plannedDate,
            plannedTime: parsedInput.plannedTime || null,
        })

        revalidatePath('/hoje')
        revalidatePath('/semana')
    })
