'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { task } from '@/db/schema/task'
import { authActionClient } from '@/lib/safe-action'
import { organizeInboxTaskSchema } from '@/lib/validators/inbox'

export const organizeInboxTask = authActionClient
    .inputSchema(organizeInboxTaskSchema)
    .action(async ({ parsedInput, ctx }) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const values = {
            TODAY_WORK: {
                area: 'WORK' as const,
                status: 'TODAY' as const,
                plannedDate: today,
            },

            TODAY_STUDIES: {
                area: 'STUDIES' as const,
                status: 'TODAY' as const,
                plannedDate: today,
            },

            TODAY_PERSONAL: {
                area: 'PERSONAL' as const,
                status: 'TODAY' as const,
                plannedDate: today,
            },

            WORK: {
                area: 'WORK' as const,
                status: 'BACKLOG' as const,
                plannedDate: null,
            },

            STUDIES: {
                area: 'STUDIES' as const,
                status: 'BACKLOG' as const,
                plannedDate: null,
            },

            PERSONAL: {
                area: 'PERSONAL' as const,
                status: 'BACKLOG' as const,
                plannedDate: null,
            },
        }

        await db
            .update(task)
            .set(values[parsedInput.destination])
            .where(
                and(
                    eq(task.id, parsedInput.taskId),
                    eq(task.userId, ctx.user.id),
                    eq(task.area, 'INBOX')
                )
            )

        revalidatePath('/inbox')
        revalidatePath('/hoje')
        revalidatePath('/semana')
    })
