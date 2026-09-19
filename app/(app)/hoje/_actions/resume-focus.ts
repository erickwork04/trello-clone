'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { focusSession } from '@/db/schema'
import { authActionClient } from '@/lib/safe-action'
import { focusSessionIdSchema } from '@/lib/validators/focus'

export const resumeFocus = authActionClient
    .inputSchema(focusSessionIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [focus] = await db
            .select()
            .from(focusSession)
            .where(
                and(
                    eq(focusSession.id, parsedInput.sessionId),
                    eq(focusSession.userId, ctx.user.id),
                    isNull(focusSession.endedAt)
                )
            )
            .limit(1)

        if (!focus || !focus.pausedAt) {
            return
        }

        await db
            .update(focusSession)
            .set({
                startedAt: new Date(),
                pausedAt: null,
            })
            .where(eq(focusSession.id, parsedInput.sessionId))

        revalidatePath('/hoje')
    })
