'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { waitlist } from '@/db/schema'
import { actionClient } from '@/lib/safe-action'
import { addToWaitlistSchema } from '@/lib/validators/waitlist'

export const addToWaitlist = actionClient
    .inputSchema(addToWaitlistSchema)
    .action(async ({ parsedInput }) => {
        const { name, email, phone } = parsedInput

        const existing = await db
            .select()
            .from(waitlist)
            .where(eq(waitlist.email, email))
            .limit(1)

        if (existing.length > 0) {
            throw new Error('Este e-mail já está na lista de espera.')
        }

        await db.insert(waitlist).values({
            name,
            email,
            phone,
        })

        return {
            message: 'Você entrou na lista de espera!',
        }
    })
