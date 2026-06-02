import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { boardColumn } from '@/db/schema/column'
import { card } from '@/db/schema/card'
import { eq, asc } from 'drizzle-orm'
import { BoardView } from '@/components/board/board-view'
import { ColumnWithCards } from '@/components/board/use-board-dnd'
import type { Card } from '@/db/schema/card'

export default async function BoardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/login')
    }

    let [userBoard] = await db
        .select()
        .from(board)
        .where(eq(board.userId, session.user.id))
        .limit(1)

    if (!userBoard) {
        const [created] = await db
            .insert(board)
            .values({ userId: session.user.id, title: 'Meu Board' })
            .onConflictDoNothing({ target: board.userId })
            .returning()

        if (!created) {
            ;[userBoard] = await db
                .select()
                .from(board)
                .where(eq(board.userId, session.user.id))
                .limit(1)
        } else {
            userBoard = created
        }
    }

    if (!userBoard) redirect('/login')

    const columns = await db
        .select()
        .from(boardColumn)
        .where(eq(boardColumn.boardId, userBoard.id))
        .orderBy(asc(boardColumn.position))

    const rawCards = await db
        .select({ c: card })
        .from(card)
        .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
        .where(eq(boardColumn.boardId, userBoard.id))
        .orderBy(asc(card.position))

    const cardsByColumnId: Record<string, Card[]> = {}
    for (const { c } of rawCards) {
        ;(cardsByColumnId[c.columnId] ??= []).push(c)
    }

    const columnsWithCards: ColumnWithCards[] = columns.map((col) => ({
        ...col,
        cards: cardsByColumnId[col.id] ?? [],
    }))

    return <BoardView board={userBoard} columns={columnsWithCards} />
}
