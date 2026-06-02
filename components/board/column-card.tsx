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

export function ColumnCard({ column, cards }: ColumnCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id, data: { type: 'column' } })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex-none w-[272px] flex flex-col rounded-[var(--radius)] bg-[color:var(--card)] border border-[color:var(--border)] shadow-sm select-none"
        >
            <div
                className="w-full h-1 rounded-t-[var(--radius)] shrink-0"
                style={{ backgroundColor: columnColorToCss(column.color) }}
                aria-hidden
            />
            <ColumnHeader
                column={column}
                listeners={listeners}
                attributes={attributes}
            />
            <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="flex-1 px-3 pb-2 flex flex-col gap-2 min-h-[60px]">
                    {cards.map((c) => (
                        <CardItem key={c.id} card={c} />
                    ))}
                    {cards.length === 0 && (
                        <div className="flex-1 flex items-center justify-center min-h-[60px] rounded-md border border-dashed border-[color:var(--border)]">
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                                Sem cards
                            </span>
                        </div>
                    )}
                </div>
            </SortableContext>
            <div className="px-3 pb-3">
                <CreateCardButton columnId={column.id} />
            </div>
        </div>
    )
}
