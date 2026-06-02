'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { boardColumn } from '@/db/schema/column'
import { card } from '@/db/schema/card'
import { authActionClient } from '@/lib/safe-action'
import { eq, max, and, asc, ne } from 'drizzle-orm'
import { columnColorSchema, columnTitleSchema } from '@/lib/validators/column'
import { cardNameSchema } from '@/lib/validators/card'

const createColumnSchema = z.object({
    title: columnTitleSchema,
    color: columnColorSchema.optional(),
})

const updateColumnSchema = z.object({
    id: z.string().min(1),
    title: columnTitleSchema.optional(),
    color: columnColorSchema.optional(),
})

const deleteColumnSchema = z.object({
    id: z.string().min(1),
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

export const createColumn = authActionClient
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

export const updateColumn = authActionClient
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
            })
            .where(eq(boardColumn.id, parsedInput.id))

        revalidatePath('/board')
    })

export const deleteColumn = authActionClient
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

        await db.delete(boardColumn).where(eq(boardColumn.id, parsedInput.id))

        revalidatePath('/board')
    })

export const reorderColumns = authActionClient
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

export const createCard = authActionClient
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

export const updateCard = authActionClient
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

export const deleteCard = authActionClient
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

export const moveCard = authActionClient
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
