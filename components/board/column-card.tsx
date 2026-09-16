'use client'

import {
    useSortable,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { BoardColumn } from '@/db/schema/column'
import { Card } from '@/db/schema/card'

import { columnColorToCss } from '@/lib/validators/column'

import { ColumnHeader } from './column-header'
import { CardItem } from './card-item'
import { CreateCardButton } from './create-card-button'

interface ColumnCardProps {
    column: BoardColumn
    cards: Card[]
}

export function ColumnCard({
    column,
    cards,
}: ColumnCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: column.id,
        data: {
            type: 'column',
        },
    })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    return (
        <section
            ref={setNodeRef}
            style={style}
            className="flex w-57.5 flex-none select-none flex-col rounded-2xl border border-slate-200 bg-slate-100/70 shadow-sm"
        >
            {/* COR DA COLUNA */}
            <div
                className="h-1.5 w-full shrink-0 rounded-t-2xl"
                style={{
                    backgroundColor:
                        columnColorToCss(
                            column.color
                        ),
                }}
                aria-hidden
            />

            {/* HEADER */}
            <div className="px-3 pt-3">
                <ColumnHeader
                    column={column}
                    listeners={listeners}
                    attributes={attributes}
                />
            </div>

            {/* CARDS */}
            <SortableContext
                items={cards.map(
                    (card) => card.id
                )}
                strategy={
                    verticalListSortingStrategy
                }
            >
                <div className="flex min-h-25 flex-1 flex-col gap-3 px-3 py-3">
                    {cards.map((card) => (
                        <CardItem
                            key={card.id}
                            card={card}
                        />
                    ))}

                    {cards.length === 0 && (
                        <div className="flex min-h-25 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60">
                            <span className="text-xs text-slate-400">
                                Sem cards
                            </span>
                        </div>
                    )}
                </div>
            </SortableContext>

            {/* CRIAR CARD */}
            <div className="px-3 pb-3">
                <CreateCardButton
                    columnId={column.id}
                />
            </div>
        </section>
    )
}