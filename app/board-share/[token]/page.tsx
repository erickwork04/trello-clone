import { and, asc, eq, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { boardShare } from '@/db/schema/board-share'
import { card } from '@/db/schema/card'
import { cardChecklistItem } from '@/db/schema/card-checklist-item'
import { boardColumn } from '@/db/schema/column'
import { hashBoardShareToken } from '@/lib/board-share-token'
import { publicBoardTokenSchema } from '@/lib/validators/board-share'
import { PublicBoardView, type PublicBoardColumn } from '@/components/board/public-board-view'

export default async function PublicBoardPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    await connection()
    const { token } = await params
    if (!publicBoardTokenSchema.safeParse(token).success) notFound()

    const [shared] = await db
        .select({ id: board.id, title: board.title })
        .from(boardShare)
        .innerJoin(board, eq(boardShare.boardId, board.id))
        .where(
            and(
                eq(boardShare.tokenHash, hashBoardShareToken(token)),
                eq(boardShare.isActive, true)
            )
        )
        .limit(1)
    if (!shared) notFound()

    const [columns, cards] = await Promise.all([
        db
            .select({
                id: boardColumn.id,
                title: boardColumn.title,
                color: boardColumn.color,
                type: boardColumn.type,
            })
            .from(boardColumn)
            .where(eq(boardColumn.boardId, shared.id))
            .orderBy(asc(boardColumn.position)),
        db
            .select({
                id: card.id,
                columnId: card.columnId,
                name: card.name,
                description: card.description,
                dueDate: card.dueDate,
                createdAt: card.createdAt,
                position: card.position,
            })
            .from(card)
            .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
            .where(eq(boardColumn.boardId, shared.id))
            .orderBy(asc(boardColumn.position), asc(card.position)),
    ])

    const cardIds = cards.map((item) => item.id)
    const checklistRows = cardIds.length
        ? await db
              .select({
                  id: cardChecklistItem.id,
                  cardId: cardChecklistItem.cardId,
                  title: cardChecklistItem.title,
                  completed: cardChecklistItem.completed,
                  position: cardChecklistItem.position,
              })
              .from(cardChecklistItem)
              .where(inArray(cardChecklistItem.cardId, cardIds))
              .orderBy(asc(cardChecklistItem.position))
        : []

    const checklistByCard = new Map<string, typeof checklistRows>()
    for (const item of checklistRows) {
        const current = checklistByCard.get(item.cardId) ?? []
        current.push(item)
        checklistByCard.set(item.cardId, current)
    }

    const cardsByColumn = new Map<string, PublicBoardColumn['cards']>()
    for (const item of cards) {
        const current = cardsByColumn.get(item.columnId) ?? []
        current.push({
            id: item.id,
            name: item.name,
            description: item.description,
            dueDate: item.dueDate?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
            checklistItems: (checklistByCard.get(item.id) ?? []).map((check) => ({
                id: check.id,
                title: check.title,
                completed: check.completed,
            })),
        })
        cardsByColumn.set(item.columnId, current)
    }

    const publicColumns: PublicBoardColumn[] = columns.map((column) => ({
        id: column.id,
        title: column.title,
        color: column.color,
        type: column.type,
        cards: cardsByColumn.get(column.id) ?? [],
    }))

    return (
        <PublicBoardView
            board={{ id: shared.id, title: shared.title, description: null }}
            columns={publicColumns}
            token={token}
        />
    )
}

export async function generateMetadata() {
    return { title: 'Kanban compartilhado | Trello Clone', robots: { index: false, follow: false } }
}
