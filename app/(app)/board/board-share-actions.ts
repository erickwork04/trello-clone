'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { boardShare } from '@/db/schema/board-share'
import { authActionClient } from '@/lib/safe-action'
import {
    createBoardShareToken,
    decryptBoardShareToken,
    encryptBoardShareToken,
    hashBoardShareToken,
} from '@/lib/board-share-token'
import { boardShareInputSchema } from '@/lib/validators/board-share'

async function ownedBoard(boardId: string, userId: string) {
    const [row] = await db
        .select({ id: board.id })
        .from(board)
        .where(and(eq(board.id, boardId), eq(board.userId, userId)))
        .limit(1)
    return row
}

export const getBoardShare = authActionClient
    .inputSchema(boardShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedBoard(parsedInput.boardId, ctx.user.id)))
            throw new Error('Board não encontrado ou sem autorização.')

        const [share] = await db
            .select({
                isActive: boardShare.isActive,
                encryptedToken: boardShare.encryptedToken,
            })
            .from(boardShare)
            .where(eq(boardShare.boardId, parsedInput.boardId))
            .limit(1)

        if (!share?.isActive || !share.encryptedToken)
            return { isActive: false, path: null }

        return {
            isActive: true,
            path: `/board-share/${decryptBoardShareToken(share.encryptedToken)}`,
        }
    })

export const activateBoardShare = authActionClient
    .inputSchema(boardShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        const path = await db.transaction(async (tx) => {
            const [owned] = await tx
                .select({ id: board.id })
                .from(board)
                .where(
                    and(
                        eq(board.id, parsedInput.boardId),
                        eq(board.userId, ctx.user.id)
                    )
                )
                .for('update')
                .limit(1)

            if (!owned)
                throw new Error('Board não encontrado ou sem autorização.')

            const [existing] = await tx
                .select()
                .from(boardShare)
                .where(eq(boardShare.boardId, owned.id))
                .for('update')
                .limit(1)

            if (existing?.isActive && existing.encryptedToken)
                return `/board-share/${decryptBoardShareToken(existing.encryptedToken)}`

            const token = createBoardShareToken()
            const values = {
                boardId: owned.id,
                tokenHash: hashBoardShareToken(token),
                encryptedToken: encryptBoardShareToken(token),
                isActive: true,
                updatedAt: new Date(),
                revokedAt: null,
            }

            if (existing)
                await tx
                    .update(boardShare)
                    .set(values)
                    .where(eq(boardShare.boardId, owned.id))
            else await tx.insert(boardShare).values(values)

            return `/board-share/${token}`
        })

        revalidatePath('/board')
        return { path }
    })

export const revokeBoardShare = authActionClient
    .inputSchema(boardShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedBoard(parsedInput.boardId, ctx.user.id)))
            throw new Error('Board não encontrado ou sem autorização.')

        await db
            .update(boardShare)
            .set({
                isActive: false,
                encryptedToken: null,
                updatedAt: new Date(),
                revokedAt: new Date(),
            })
            .where(eq(boardShare.boardId, parsedInput.boardId))

        revalidatePath('/board')
        return { isActive: false }
    })
