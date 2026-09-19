'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boardColumn } from '@/db/schema/column'
import { card } from '@/db/schema/card'
import { cardTag } from '@/db/schema/card-tag'
import { cardChecklistItem } from '@/db/schema/card-checklist-item'
import { tag } from '@/db/schema/tag'
import { authBoardActionClient } from '@/lib/safe-action'
import { eq, max, and, asc, ne } from 'drizzle-orm'
import {
    columnColorSchema,
    columnTitleSchema,
    columnTypeSchema,
} from '@/lib/validators/column'
import {
    cardNameSchema,
    createChecklistItemSchema,
    deleteChecklistItemSchema,
    toggleCardTagSchema,
    toggleChecklistItemSchema,
    updateCardDetailsSchema,
} from '@/lib/validators/card'

const createColumnSchema = z.object({
    title: columnTitleSchema,
    color: columnColorSchema.optional(),
})

const updateColumnSchema = z.object({
    id: z.string(),
    title: columnTitleSchema.optional(),
    color: columnColorSchema.optional(),
    type: columnTypeSchema.optional(),
})

const deleteColumnSchema = z.object({
    id: z.string().min(1),
    targetColumnId: z.string().min(1).optional(),
})

const reorderColumnsSchema = z.object({
    orderedIds: z.array(z.string()).min(1, 'Lista de colunas inválida.'),
})

const createCardSchema = z.object({
    columnId: z.string().min(1),
    name: cardNameSchema,
})

const updateCardSchema = z.object({
    id: z.string().min(1),
    name: cardNameSchema,
})

const deleteCardSchema = z.object({
    id: z.string().min(1),
})

const moveCardSchema = z.object({
    cardId: z.string().min(1),
    targetColumnId: z.string().min(1),
    targetPosition: z.number().int().min(0),
})

export const createColumn = authBoardActionClient
    .inputSchema(createColumnSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [result] = await db
            .select({ maxPos: max(boardColumn.position) })
            .from(boardColumn)
            .where(eq(boardColumn.boardId, ctx.boardId))

        const nextPosition = (result?.maxPos ?? -1) + 1

        await db.insert(boardColumn).values({
            boardId: ctx.boardId,
            title: parsedInput.title,
            position: nextPosition,
            color: parsedInput.color ?? 'slate',
        })

        revalidatePath('/board')
    })

export const updateColumn = authBoardActionClient
    .inputSchema(updateColumnSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [col] = await db
            .select()
            .from(boardColumn)
            .where(
                and(
                    eq(boardColumn.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!col) throw new Error('Coluna não encontrada.')

        await db
            .update(boardColumn)
            .set({
                ...(parsedInput.title !== undefined && {
                    title: parsedInput.title,
                }),
                ...(parsedInput.color !== undefined && {
                    color: parsedInput.color,
                }),
                ...(parsedInput.type !== undefined && {
                    type: parsedInput.type,
                }),
            })
            .where(eq(boardColumn.id, parsedInput.id))

        revalidatePath('/board')
    })

export const deleteColumn = authBoardActionClient
    .inputSchema(deleteColumnSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [col] = await db
            .select()
            .from(boardColumn)
            .where(
                and(
                    eq(boardColumn.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!col) throw new Error('Coluna não encontrada.')

        const cardsInColumn = await db
            .select({ id: card.id })
            .from(card)
            .where(eq(card.columnId, parsedInput.id))

        if (cardsInColumn.length > 0) {
            if (!parsedInput.targetColumnId) {
                throw new Error(
                    `Esta coluna possui ${cardsInColumn.length} tarefa(s). Selecione para onde movê-las antes de excluir.`
                )
            }

            if (parsedInput.targetColumnId === parsedInput.id) {
                throw new Error(
                    'A coluna de destino não pode ser a mesma que está sendo excluída.'
                )
            }

            const [targetCol] = await db
                .select({ id: boardColumn.id })
                .from(boardColumn)
                .where(
                    and(
                        eq(boardColumn.id, parsedInput.targetColumnId),
                        eq(boardColumn.boardId, ctx.boardId)
                    )
                )
                .limit(1)

            if (!targetCol) {
                throw new Error('Coluna de destino não encontrada.')
            }

            await db.transaction(async (tx) => {
                const [result] = await tx
                    .select({ maxPos: max(card.position) })
                    .from(card)
                    .where(eq(card.columnId, parsedInput.targetColumnId!))

                let nextPosition = (result?.maxPos ?? -1) + 1

                for (const item of cardsInColumn) {
                    await tx
                        .update(card)
                        .set({
                            columnId: parsedInput.targetColumnId,
                            position: nextPosition,
                        })
                        .where(eq(card.id, item.id))

                    nextPosition += 1
                }

                await tx
                    .delete(boardColumn)
                    .where(eq(boardColumn.id, parsedInput.id))
            })
        } else {
            await db
                .delete(boardColumn)
                .where(eq(boardColumn.id, parsedInput.id))
        }

        revalidatePath('/board')
    })

export const reorderColumns = authBoardActionClient
    .inputSchema(reorderColumnsSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db.transaction(async (tx) => {
            const currentColumns = await tx
                .select({ id: boardColumn.id })
                .from(boardColumn)
                .where(eq(boardColumn.boardId, ctx.boardId))

            const currentIds = new Set(currentColumns.map((c) => c.id))
            const inputIds = new Set(parsedInput.orderedIds)

            const sameSize = currentIds.size === inputIds.size
            const sameIds = [...inputIds].every((id) => currentIds.has(id))

            if (!sameSize || !sameIds) {
                throw new Error('Lista de colunas desatualizada.')
            }

            for (let i = 0; i < parsedInput.orderedIds.length; i++) {
                await tx
                    .update(boardColumn)
                    .set({ position: i })
                    .where(
                        and(
                            eq(boardColumn.id, parsedInput.orderedIds[i]),
                            eq(boardColumn.boardId, ctx.boardId)
                        )
                    )
            }
        })

        revalidatePath('/board')
    })

export const createCard = authBoardActionClient
    .inputSchema(createCardSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [col] = await db
            .select({ id: boardColumn.id })
            .from(boardColumn)
            .where(
                and(
                    eq(boardColumn.id, parsedInput.columnId),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!col) throw new Error('Coluna não encontrada.')

        const [result] = await db
            .select({ maxPos: max(card.position) })
            .from(card)
            .where(eq(card.columnId, parsedInput.columnId))

        const nextPosition = (result?.maxPos ?? -1) + 1

        await db.insert(card).values({
            columnId: parsedInput.columnId,
            name: parsedInput.name,
            position: nextPosition,
        })

        revalidatePath('/board')
    })

export const updateCard = authBoardActionClient
    .inputSchema(updateCardSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [row] = await db
            .select({ id: card.id })
            .from(card)
            .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
            .where(
                and(
                    eq(card.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!row) throw new Error('Card não encontrado.')

        await db
            .update(card)
            .set({ name: parsedInput.name })
            .where(eq(card.id, parsedInput.id))

        revalidatePath('/board')
    })

export const deleteCard = authBoardActionClient
    .inputSchema(deleteCardSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [row] = await db
            .select({ id: card.id })
            .from(card)
            .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
            .where(
                and(
                    eq(card.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!row) throw new Error('Card não encontrado.')

        await db.delete(card).where(eq(card.id, parsedInput.id))

        revalidatePath('/board')
    })

export const moveCard = authBoardActionClient
    .inputSchema(moveCardSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { cardId, targetColumnId, targetPosition } = parsedInput

        await db.transaction(async (tx) => {
            const [cardRow] = await tx
                .select({ id: card.id, columnId: card.columnId })
                .from(card)
                .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
                .where(
                    and(
                        eq(card.id, cardId),
                        eq(boardColumn.boardId, ctx.boardId)
                    )
                )
                .limit(1)

            if (!cardRow) throw new Error('Card não encontrado.')

            const sourceColumnId = cardRow.columnId
            const isSameColumn = sourceColumnId === targetColumnId

            if (!isSameColumn) {
                const [targetCol] = await tx
                    .select({ id: boardColumn.id })
                    .from(boardColumn)
                    .where(
                        and(
                            eq(boardColumn.id, targetColumnId),
                            eq(boardColumn.boardId, ctx.boardId)
                        )
                    )
                    .limit(1)

                if (!targetCol)
                    throw new Error('Coluna de destino não encontrada.')
            }

            if (isSameColumn) {
                const sourceCards = await tx
                    .select({ id: card.id })
                    .from(card)
                    .where(eq(card.columnId, sourceColumnId))
                    .orderBy(asc(card.position))

                const oldIndex = sourceCards.findIndex((c) => c.id === cardId)
                const clamped = Math.min(targetPosition, sourceCards.length - 1)

                if (oldIndex === clamped) return

                const reordered = [...sourceCards]
                const [moved] = reordered.splice(oldIndex, 1)
                reordered.splice(clamped, 0, moved)

                for (let i = 0; i < reordered.length; i++) {
                    await tx
                        .update(card)
                        .set({ position: i })
                        .where(eq(card.id, reordered[i].id))
                }
            } else {
                const sourceCards = await tx
                    .select({ id: card.id })
                    .from(card)
                    .where(
                        and(
                            eq(card.columnId, sourceColumnId),
                            ne(card.id, cardId)
                        )
                    )
                    .orderBy(asc(card.position))

                for (let i = 0; i < sourceCards.length; i++) {
                    await tx
                        .update(card)
                        .set({ position: i })
                        .where(eq(card.id, sourceCards[i].id))
                }

                const targetCards = await tx
                    .select({ id: card.id })
                    .from(card)
                    .where(eq(card.columnId, targetColumnId))
                    .orderBy(asc(card.position))

                const clamped = Math.min(targetPosition, targetCards.length)

                for (let i = clamped; i < targetCards.length; i++) {
                    await tx
                        .update(card)
                        .set({ position: i + 1 })
                        .where(eq(card.id, targetCards[i].id))
                }

                await tx
                    .update(card)
                    .set({ columnId: targetColumnId, position: clamped })
                    .where(eq(card.id, cardId))
            }
        })

        revalidatePath('/board')
    })

/**
 * Verifica ownership do card via join com boardColumn (mesmo padrão
 * usado em updateCard/deleteCard/moveCard acima).
 */
async function findOwnedCard(cardId: string, boardId: string) {
    const [row] = await db
        .select({ id: card.id })
        .from(card)
        .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
        .where(and(eq(card.id, cardId), eq(boardColumn.boardId, boardId)))
        .limit(1)

    return row
}

export const updateCardDetails = authBoardActionClient
    .inputSchema(updateCardDetailsSchema)
    .action(async ({ parsedInput, ctx }) => {
        const owned = await findOwnedCard(parsedInput.cardId, ctx.boardId)

        if (!owned) throw new Error('Card não encontrado.')

        const updates: {
            description?: string | null
            dueDate?: Date | null
        } = {}

        if (parsedInput.description !== undefined) {
            updates.description = parsedInput.description?.trim() || null
        }

        if (parsedInput.dueDate !== undefined) {
            updates.dueDate = parsedInput.dueDate
                ? new Date(`${parsedInput.dueDate}T00:00:00`)
                : null
        }

        await db.update(card).set(updates).where(eq(card.id, parsedInput.cardId))

        revalidatePath('/board')
    })

export const toggleCardTag = authBoardActionClient
    .inputSchema(toggleCardTagSchema)
    .action(async ({ parsedInput, ctx }) => {
        const owned = await findOwnedCard(parsedInput.cardId, ctx.boardId)

        if (!owned) throw new Error('Card não encontrado.')

        const [ownedTag] = await db
            .select({ id: tag.id })
            .from(tag)
            .where(and(eq(tag.id, parsedInput.tagId), eq(tag.userId, ctx.user.id)))
            .limit(1)

        if (!ownedTag) throw new Error('Tag não encontrada.')

        if (parsedInput.attach) {
            await db
                .insert(cardTag)
                .values({
                    cardId: parsedInput.cardId,
                    tagId: parsedInput.tagId,
                })
                .onConflictDoNothing()
        } else {
            await db
                .delete(cardTag)
                .where(
                    and(
                        eq(cardTag.cardId, parsedInput.cardId),
                        eq(cardTag.tagId, parsedInput.tagId)
                    )
                )
        }

        revalidatePath('/board')
    })

export const createChecklistItem = authBoardActionClient
    .inputSchema(createChecklistItemSchema)
    .action(async ({ parsedInput, ctx }) => {
        const owned = await findOwnedCard(parsedInput.cardId, ctx.boardId)

        if (!owned) throw new Error('Card não encontrado.')

        const [result] = await db
            .select({ maxPos: max(cardChecklistItem.position) })
            .from(cardChecklistItem)
            .where(eq(cardChecklistItem.cardId, parsedInput.cardId))

        const nextPosition = (result?.maxPos ?? -1) + 1

        await db.insert(cardChecklistItem).values({
            cardId: parsedInput.cardId,
            title: parsedInput.title,
            position: nextPosition,
        })

        revalidatePath('/board')
    })

export const toggleChecklistItem = authBoardActionClient
    .inputSchema(toggleChecklistItemSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [row] = await db
            .select({ id: cardChecklistItem.id })
            .from(cardChecklistItem)
            .innerJoin(card, eq(cardChecklistItem.cardId, card.id))
            .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
            .where(
                and(
                    eq(cardChecklistItem.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!row) throw new Error('Item não encontrado.')

        await db
            .update(cardChecklistItem)
            .set({ completed: parsedInput.completed })
            .where(eq(cardChecklistItem.id, parsedInput.id))

        revalidatePath('/board')
    })

export const deleteChecklistItem = authBoardActionClient
    .inputSchema(deleteChecklistItemSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [row] = await db
            .select({ id: cardChecklistItem.id })
            .from(cardChecklistItem)
            .innerJoin(card, eq(cardChecklistItem.cardId, card.id))
            .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
            .where(
                and(
                    eq(cardChecklistItem.id, parsedInput.id),
                    eq(boardColumn.boardId, ctx.boardId)
                )
            )
            .limit(1)

        if (!row) throw new Error('Item não encontrado.')

        await db
            .delete(cardChecklistItem)
            .where(eq(cardChecklistItem.id, parsedInput.id))

        revalidatePath('/board')
    })
