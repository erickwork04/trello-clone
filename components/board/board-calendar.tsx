'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ListChecks } from 'lucide-react'

import { BoardCard } from './use-board-dnd'

interface BoardCalendarProps {
    cards: Array<BoardCard & { columnTitle: string }>
    onOpenCard: (cardId: string) => void
}

function dateKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function BoardCalendar({ cards, onOpenCard }: BoardCalendarProps) {
    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
    const [selectedDay, setSelectedDay] = useState<string | null>(() =>
        dateKey(new Date())
    )

    const cardsByDay = useMemo(() => {
        const map = new Map<string, Array<BoardCard & { columnTitle: string }>>()

        for (const card of cards) {
            if (!card.dueDate) continue
            const key = dateKey(new Date(card.dueDate))
            const current = map.get(key) ?? []
            current.push(card)
            map.set(key, current)
        }

        return map
    }, [cards])

    const gridDays = useMemo(() => {
        const first = monthCursor
        const firstWeekday = first.getDay()
        const daysInMonth = new Date(
            first.getFullYear(),
            first.getMonth() + 1,
            0
        ).getDate()

        const days: Array<{ date: Date; inCurrentMonth: boolean }> = []

        for (let i = 0; i < firstWeekday; i++) {
            const date = new Date(first)
            date.setDate(date.getDate() - (firstWeekday - i))
            days.push({ date, inCurrentMonth: false })
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push({
                date: new Date(first.getFullYear(), first.getMonth(), day),
                inCurrentMonth: true,
            })
        }

        while (days.length % 7 !== 0) {
            const last = days[days.length - 1].date
            const date = new Date(last)
            date.setDate(date.getDate() + 1)
            days.push({ date, inCurrentMonth: false })
        }

        return days
    }, [monthCursor])

    const todayKey = dateKey(new Date())
    const selectedCards = selectedDay ? cardsByDay.get(selectedDay) ?? [] : []

    return (
        <div className="flex h-full min-h-0 flex-col overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto w-full max-w-2xl">
                {/* CABEÇALHO DO MÊS */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() =>
                            setMonthCursor(
                                (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                            )
                        }
                        className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        aria-label="Mês anterior"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    <p className="text-sm font-semibold capitalize text-slate-900">
                        {monthCursor.toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            setMonthCursor(
                                (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                            )
                        }
                        className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                        aria-label="Próximo mês"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                {/* GRID DO CALENDÁRIO */}
                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAY_LABELS.map((label, i) => (
                        <div
                            key={i}
                            className="py-1 text-[11px] font-medium text-slate-400"
                        >
                            {label}
                        </div>
                    ))}

                    {gridDays.map(({ date, inCurrentMonth }) => {
                        const key = dateKey(date)
                        const count = cardsByDay.get(key)?.length ?? 0
                        const isSelected = key === selectedDay
                        const isToday = key === todayKey

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedDay(key)}
                                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                                    !inCurrentMonth
                                        ? 'text-slate-300'
                                        : isSelected
                                            ? 'bg-blue-600 text-white'
                                            : isToday
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {date.getDate()}
                                {count > 0 && (
                                    <span
                                        className={`mt-0.5 size-1.5 rounded-full ${
                                            isSelected ? 'bg-white' : 'bg-blue-500'
                                        }`}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* TAREFAS DO DIA */}
                <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {selectedDay
                            ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(
                                'pt-BR',
                                { day: '2-digit', month: 'long' }
                            )
                            : 'Selecione um dia'}
                    </p>

                    {selectedCards.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            Nenhum card com prazo neste dia.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {selectedCards.map((card) => (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => onOpenCard(card.id)}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {card.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {card.columnTitle}
                                        </p>
                                    </div>

                                    {card.checklistItems.length > 0 && (
                                        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                                            <ListChecks className="size-3.5" />
                                            {
                                                card.checklistItems.filter(
                                                    (i) => i.completed
                                                ).length
                                            }
                                            /{card.checklistItems.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
