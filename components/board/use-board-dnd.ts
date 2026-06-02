'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { toast } from 'sonner'
import { BoardColumn } from '@/db/schema/column'
import { Card } from '@/db/schema/card'
import { reorderColumns, moveCard } from '@/app/(app)/board/actions'

export type ColumnWithCards = BoardColumn & { cards: Card[] }

export function useBoardDnd(initialColumns: ColumnWithCards[]) {
    const [columns, setColumns] = useState(initialColumns)
    const columnsRef = useRef(columns)
    const isDragging = useRef(false)
    const previousColumnsRef = useRef<ColumnWithCards[] | null>(null)
    // Captured at drag start — active.data.current.columnId updates reactively
    // as the card re-renders in the new column during onDragOver, so we can't
    // rely on it in onDragEnd to detect cross-column moves.
    const originalCardColumnRef = useRef<string | null>(null)

    useEffect(() => {
        columnsRef.current = columns
    })

    useEffect(() => {
        if (!isDragging.current) {
            setColumns(initialColumns)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        initialColumns
            .map(
                (c) =>
                    `${c.id}:${c.position}:${c.title}:${c.color}:${c.cards.map((cd) => `${cd.id}:${cd.position}:${cd.name}`).join('|')}`
            )
            .join(','),
    ])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        isDragging.current = true
        previousColumnsRef.current = columnsRef.current
        const type = event.active.data.current?.type as string | undefined
        originalCardColumnRef.current =
            type === 'card'
                ? (event.active.data.current?.columnId as string)
                : null
    }, [])

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeType = active.data.current?.type as string | undefined
        if (activeType !== 'card') return

        const activeId = String(active.id)
        const overId = String(over.id)
        if (activeId === overId) return

        const current = columnsRef.current
        const sourceColumn = current.find((col) =>
            col.cards.some((c) => c.id === activeId)
        )
        if (!sourceColumn) return

        const overType = over.data.current?.type as string | undefined
        let targetColumnId: string

        if (overType === 'card') {
            const overColumn = current.find((col) =>
                col.cards.some((c) => c.id === overId)
            )
            if (!overColumn) return
            targetColumnId = overColumn.id
        } else if (overType === 'column') {
            targetColumnId = overId
        } else {
            return
        }

        if (sourceColumn.id === targetColumnId) return

        const targetIndex = (() => {
            if (overType === 'card') {
                const targetCol = current.find((c) => c.id === targetColumnId)
                return targetCol?.cards.findIndex((c) => c.id === overId) ?? 0
            }
            return (
                current.find((c) => c.id === targetColumnId)?.cards.length ?? 0
            )
        })()

        const movingCard = sourceColumn.cards.find((c) => c.id === activeId)!

        setColumns((prev) =>
            prev.map((col) => {
                if (col.id === sourceColumn.id) {
                    return {
                        ...col,
                        cards: col.cards.filter((c) => c.id !== activeId),
                    }
                }
                if (col.id === targetColumnId) {
                    const newCards = [...col.cards]
                    newCards.splice(targetIndex, 0, {
                        ...movingCard,
                        columnId: targetColumnId,
                    })
                    return { ...col, cards: newCards }
                }
                return col
            })
        )
    }, [])

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        isDragging.current = false
        const { active, over } = event

        if (!over) {
            if (previousColumnsRef.current)
                setColumns(previousColumnsRef.current)
            previousColumnsRef.current = null
            originalCardColumnRef.current = null
            return
        }

        const activeType = active.data.current?.type as string | undefined
        const activeId = String(active.id)

        if (activeType === 'column') {
            const overId = String(over.id)
            if (activeId === overId) {
                previousColumnsRef.current = null
                return
            }

            const current = columnsRef.current
            const oldIndex = current.findIndex((c) => c.id === activeId)
            const newIndex = current.findIndex((c) => c.id === overId)

            if (oldIndex === -1 || newIndex === -1) {
                previousColumnsRef.current = null
                return
            }

            const previous = current
            const reordered = arrayMove(current, oldIndex, newIndex)
            setColumns(reordered)

            const result = await reorderColumns({
                orderedIds: reordered.map((c) => c.id),
            })

            if (result?.serverError) {
                setColumns(previous)
                toast.error('Erro ao reordenar colunas.')
            }
        } else if (activeType === 'card') {
            const originalColumnId = originalCardColumnRef.current
            const current = columnsRef.current
            const finalColumn = current.find((col) =>
                col.cards.some((c) => c.id === activeId)
            )

            if (!finalColumn) {
                previousColumnsRef.current = null
                return
            }

            const isCrossColumn = finalColumn.id !== originalColumnId

            if (isCrossColumn) {
                const finalPosition = finalColumn.cards.findIndex(
                    (c) => c.id === activeId
                )
                const previous = previousColumnsRef.current ?? current

                const result = await moveCard({
                    cardId: activeId,
                    targetColumnId: finalColumn.id,
                    targetPosition: finalPosition,
                })

                if (result?.serverError) {
                    setColumns(previous)
                    toast.error('Erro ao mover card.')
                }
            } else {
                const overId = String(over.id)
                if (activeId === overId) {
                    previousColumnsRef.current = null
                    return
                }

                const overType = over.data.current?.type as string | undefined
                const cards = finalColumn.cards
                const oldIndex = cards.findIndex((c) => c.id === activeId)

                let newIndex: number
                if (overType === 'card') {
                    newIndex = cards.findIndex((c) => c.id === overId)
                } else {
                    newIndex = cards.length - 1
                }

                if (
                    oldIndex === -1 ||
                    newIndex === -1 ||
                    oldIndex === newIndex
                ) {
                    previousColumnsRef.current = null
                    return
                }

                const previous = current
                const reordered = arrayMove(cards, oldIndex, newIndex)
                setColumns((prev) =>
                    prev.map((col) => {
                        if (col.id !== finalColumn.id) return col
                        return { ...col, cards: reordered }
                    })
                )

                const result = await moveCard({
                    cardId: activeId,
                    targetColumnId: finalColumn.id,
                    targetPosition: newIndex,
                })

                if (result?.serverError) {
                    setColumns(previous)
                    toast.error('Erro ao mover card.')
                }
            }
        }

        previousColumnsRef.current = null
        originalCardColumnRef.current = null
    }, [])

    return { columns, handleDragStart, handleDragOver, handleDragEnd }
}
