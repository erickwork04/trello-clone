import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { board } from '@/db/schema/board'
import { boardColumn } from '@/db/schema/column'
import { card } from '@/db/schema/card'
import { cardTag } from '@/db/schema/card-tag'
import { cardChecklistItem } from '@/db/schema/card-checklist-item'
import { tag } from '@/db/schema/tag'
import { eq, asc, inArray } from 'drizzle-orm'
import { BoardView } from '@/components/board/board-view'
import { BoardCard, ColumnWithCards } from '@/components/board/use-board-dnd'
import { getPriorityTagId } from '@/lib/board/priority-tag'
import { client as clientTable } from '@/db/schema/client'
import { project } from '@/db/schema/project'
import { requirementSurvey } from '@/db/schema/requirement-survey'
import { projectRequirement } from '@/db/schema/project-requirement'
import { meeting } from '@/db/schema/meeting'

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
            .values({
                userId: session.user.id,
                title: 'Connect Board',
            })
            .onConflictDoNothing({
                target: board.userId,
            })
            .returning()

        if (!created) {
            ;[userBoard] = await db
                .select()
                .from(board)
                .where(
                    eq(
                        board.userId,
                        session.user.id
                    )
                )
                .limit(1)
        } else {
            userBoard = created
        }
    }

    if (!userBoard) {
        redirect('/login')
    }

    const columns = await db
        .select()
        .from(boardColumn)
        .where(
            eq(
                boardColumn.boardId,
                userBoard.id
            )
        )
        .orderBy(
            asc(boardColumn.position)
        )

    const rawCards = await db
        .select({
            c: card,
            requirementTitle: projectRequirement.title,
        })
        .from(card)
        .innerJoin(
            boardColumn,
            eq(
                card.columnId,
                boardColumn.id
            )
        )
        .leftJoin(projectRequirement, eq(card.requirementId, projectRequirement.id))
        .where(
            eq(
                boardColumn.boardId,
                userBoard.id
            )
        )
        .orderBy(
            asc(card.position)
        )

    const cardIds = rawCards.map(({ c }) => c.id)

    const [userTags, cardTagRows, checklistRows, priorityTagId] =
        await Promise.all([
            db
                .select()
                .from(tag)
                .where(eq(tag.userId, session.user.id))
                .orderBy(asc(tag.name)),

            cardIds.length > 0
                ? db
                    .select({
                        cardId: cardTag.cardId,
                        id: tag.id,
                        name: tag.name,
                        color: tag.color,
                    })
                    .from(cardTag)
                    .innerJoin(tag, eq(cardTag.tagId, tag.id))
                    .where(inArray(cardTag.cardId, cardIds))
                : Promise.resolve([]),

            cardIds.length > 0
                ? db
                    .select()
                    .from(cardChecklistItem)
                    .where(inArray(cardChecklistItem.cardId, cardIds))
                    .orderBy(asc(cardChecklistItem.position))
                : Promise.resolve([]),

            getPriorityTagId(session.user.id),
        ])

    const tagsByCardId = new Map<
        string,
        Array<{ id: string; name: string; color: string }>
    >()

    for (const row of cardTagRows) {
        const current = tagsByCardId.get(row.cardId) ?? []
        current.push({ id: row.id, name: row.name, color: row.color })
        tagsByCardId.set(row.cardId, current)
    }

    const checklistByCardId = new Map<
        string,
        Array<{
            id: string
            title: string
            completed: boolean
            position: number
        }>
    >()

    for (const item of checklistRows) {
        const current = checklistByCardId.get(item.cardId) ?? []
        current.push({
            id: item.id,
            title: item.title,
            completed: item.completed,
            position: item.position,
        })
        checklistByCardId.set(item.cardId, current)
    }

    const cardsByColumnId: Record<
        string,
        BoardCard[]
    > = {}

    for (const { c, requirementTitle } of rawCards) {
        ; (
            cardsByColumnId[c.columnId] ??=
            []
        ).push({
            ...c,
            requirementTitle: requirementTitle ?? null,
            tags: tagsByCardId.get(c.id) ?? [],
            checklistItems: checklistByCardId.get(c.id) ?? [],
        })
    }

    const columnsWithCards: ColumnWithCards[] =
        columns.map((column) => ({
            ...column,
            cards:
                cardsByColumnId[
                column.id
                ] ?? [],
        }))

    const [clients, projects, surveys, requirements, meetings] = await Promise.all([
        db.select().from(clientTable).where(eq(clientTable.userId, session.user.id)).orderBy(asc(clientTable.name)),
        db.select().from(project).where(eq(project.userId, session.user.id)).orderBy(asc(project.name)),
        db.select().from(requirementSurvey).where(eq(requirementSurvey.userId, session.user.id)),
        db.select().from(projectRequirement).where(eq(projectRequirement.userId, session.user.id)).orderBy(asc(projectRequirement.createdAt)),
        db.select().from(meeting).where(eq(meeting.userId, session.user.id)).orderBy(asc(meeting.meetingDate)),
    ])

    // "Prioridade máxima" = cards pendentes (coluna não é DONE) com a
    // tag de prioridade máxima. Ver lib/board/priority-tag.ts.
    const priorityCardsCount = priorityTagId
        ? columnsWithCards
            .filter((column) => column.type !== 'DONE')
            .reduce(
                (total, column) =>
                    total +
                    column.cards.filter((c) =>
                        c.tags.some((t) => t.id === priorityTagId)
                    ).length,
                0
            )
        : 0

    return (
        <BoardView
            board={userBoard}
            columns={columnsWithCards}
            availableTags={userTags}
            priorityCardsCount={priorityCardsCount}
            hasPriorityTag={priorityTagId !== null}
            workData={{ clients, projects, surveys, requirements, meetings, linkedRequirementIds: rawCards.flatMap(({ c }) => c.requirementId ? [c.requirementId] : []) }}
        />
    )
}
