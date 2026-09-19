import { createSafeActionClient } from 'next-safe-action'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { eq } from 'drizzle-orm'

export const actionClient = createSafeActionClient({
    defaultValidationErrorsShape: 'flattened',
})

/**
 * Client base para qualquer Server Action que só precisa do usuário
 * autenticado. É o client padrão para a maioria das actions do app
 * (tasks, tags, semana, inbox, sessão de foco...).
 */
export const authActionClient = actionClient.use(async ({ next }) => {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    return next({ ctx: { user: session.user } })
})

/**
 * Extensão de authActionClient para actions do domínio Board, que
 * também precisam do boardId do usuário (hoje, um board por usuário).
 * Isolado do client genérico para não forçar um lookup de board em
 * actions que nunca usam esse dado (tasks, tags, semana, etc.).
 */
export const authBoardActionClient = authActionClient.use(
    async ({ next, ctx }) => {
        const [userBoard] = await db
            .select()
            .from(board)
            .where(eq(board.userId, ctx.user.id))
            .limit(1)

        if (!userBoard) {
            throw new Error('Board não encontrado.')
        }

        return next({ ctx: { ...ctx, boardId: userBoard.id } })
    }
)
