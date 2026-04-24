import { createSafeActionClient } from 'next-safe-action'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { eq } from 'drizzle-orm'

export const actionClient = createSafeActionClient({
    defaultValidationErrorsShape: 'flattened',
})

export const authActionClient = actionClient.use(async ({ next }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const [userBoard] = await db
        .select()
        .from(board)
        .where(eq(board.userId, session.user.id))
        .limit(1)

    if (!userBoard) {
        throw new Error('Board não encontrado.')
    }

    return next({ ctx: { user: session.user, boardId: userBoard.id } })
})
