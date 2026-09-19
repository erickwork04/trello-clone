'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cardNameSchema } from '@/lib/validators/card'
import { updateCard } from '@/app/(app)/board/actions'
import { BoardCard, CardTagOption } from './use-board-dnd'
import { CardMenu } from './card-menu'

const nameSchema = z.object({ name: cardNameSchema })
type NameForm = z.infer<typeof nameSchema>

interface CardItemProps {
    card: BoardCard
    allColumns: Array<{ id: string; title: string; type: string }>
    availableTags: CardTagOption[]
    onOpenCard: (cardId: string) => void
}

export function CardItem({
    card,
    allColumns,
    availableTags,
    onOpenCard,
}: CardItemProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [editing, setEditing] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: 'card', columnId: card.columnId },
    })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    const { register, handleSubmit, setValue } = useForm<NameForm>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: card.name },
    })

    const { execute: execUpdate } = useAction(updateCard, {
        onError: () => {
            setValue('name', card.name)
            toast.error('Erro ao atualizar card.')
        },
    })

    const onBlur = handleSubmit((data) => {
        setEditing(false)
        if (data.name !== card.name) {
            execUpdate({ id: card.id, name: data.name })
        }
    })

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            inputRef.current?.blur()
        }
    }

    const { ref: registerRef, ...registerRest } = register('name')

    const completedChecklist = card.checklistItems.filter(
        (i) => i.completed
    ).length

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                if (editing) return
                e.stopPropagation()
                onOpenCard(card.id)
            }}
            className="group bg-[color:var(--card)] rounded-md border border-[color:var(--border)] px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing touch-none"
        >
            <div className="flex items-center gap-2">
                <input
                    {...registerRest}
                    ref={(el) => {
                        registerRef(el)
                        inputRef.current = el
                    }}
                    readOnly={!editing}
                    onFocus={() => setEditing(true)}
                    onBlur={onBlur}
                    onKeyDown={handleKeyDown}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-w-0 text-sm text-[color:var(--foreground)] bg-transparent border-none outline-none focus:ring-0 focus:outline-none cursor-text"
                    aria-label="Nome do card"
                />

                <CardMenu
                    card={card}
                    columns={allColumns}
                    availableTags={availableTags}
                    onOpenDetails={() => onOpenCard(card.id)}
                    onEdit={() => {
                        setEditing(true)
                        requestAnimationFrame(() => inputRef.current?.focus())
                    }}
                />
            </div>

            {(card.tags.length > 0 ||
                card.checklistItems.length > 0 ||
                card.dueDate) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {card.tags.map((t) => (
                        <span
                            key={t.id}
                            className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                                backgroundColor: `${t.color}20`,
                                color: t.color,
                            }}
                        >
                            <span
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                        </span>
                    ))}

                    {card.checklistItems.length > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <ListChecks className="size-3" />
                            {completedChecklist}/{card.checklistItems.length}
                        </span>
                    )}

                    {card.dueDate && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <CalendarDays className="size-3" />
                            {new Date(card.dueDate).toLocaleDateString(
                                'pt-BR',
                                { day: '2-digit', month: '2-digit' }
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
