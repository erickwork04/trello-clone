'use client'

import { CalendarDays, ListChecks } from 'lucide-react'

import { BoardCard, CardTagOption } from './use-board-dnd'
import { CardMenu } from './card-menu'

interface BoardListProps {
    cards: Array<BoardCard & { columnTitle: string }>
    allColumns: Array<{ id: string; title: string; type: string }>
    availableTags: CardTagOption[]
    onOpenCard: (cardId: string) => void
}

export function BoardList({
    cards,
    allColumns,
    availableTags,
    onOpenCard,
}: BoardListProps) {
    if (cards.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-slate-400">
                    Nenhum card encontrado.
                </p>
            </div>
        )
    }

    return (
        <div className="h-full min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                {cards.map((card) => {
                    const completedChecklist = card.checklistItems.filter(
                        (i) => i.completed
                    ).length

                    return (
                        <div
                            key={card.id}
                            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                        >
                            <button
                                type="button"
                                onClick={() => onOpenCard(card.id)}
                                className="min-w-0 flex-1 text-left"
                            >
                                <p className="truncate text-sm font-medium text-slate-900">
                                    {card.name}
                                </p>

                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                        {card.columnTitle}
                                    </span>

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
                                                style={{
                                                    backgroundColor: t.color,
                                                }}
                                            />
                                            {t.name}
                                        </span>
                                    ))}

                                    {card.dueDate && (
                                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                            <CalendarDays className="size-3" />
                                            {new Date(
                                                card.dueDate
                                            ).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                            })}
                                        </span>
                                    )}

                                    {card.checklistItems.length > 0 && (
                                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                            <ListChecks className="size-3" />
                                            {completedChecklist}/
                                            {card.checklistItems.length}
                                        </span>
                                    )}
                                </div>
                            </button>

                            <CardMenu
                                card={card}
                                columns={allColumns}
                                availableTags={availableTags}
                                onOpenDetails={() => onOpenCard(card.id)}
                                onEdit={() => onOpenCard(card.id)}
                                alwaysVisible
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
