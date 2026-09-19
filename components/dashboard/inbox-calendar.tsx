'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { InboxTaskCard } from '@/components/dashboard/inbox-task-card'

type InboxStage = 'ARRIVED' | 'ORGANIZE' | 'NEXT' | 'ORGANIZED'

interface TaskTag {
    id: string
    name: string
    color: string
}

interface InboxCalendarTask {
    id: string
    title: string
    description: string | null
    createdAt: Date
    plannedDate: Date | null
    completedAt: Date | null
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    inboxStage: InboxStage
    tags: TaskTag[]
}

interface InboxCalendarProps {
    tasks: InboxCalendarTask[]
    availableTags: TaskTag[]
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

export function InboxCalendar({ tasks, availableTags }: InboxCalendarProps) {
    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
    const [selectedDay, setSelectedDay] = useState<string | null>(() =>
        dateKey(new Date())
    )

    const tasksByDay = useMemo(() => {
        const map = new Map<string, InboxCalendarTask[]>()

        for (const task of tasks) {
            if (!task.plannedDate) continue
            const key = dateKey(new Date(task.plannedDate))
            const current = map.get(key) ?? []
            current.push(task)
            map.set(key, current)
        }

        return map
    }, [tasks])

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
    const selectedTasks = selectedDay ? tasksByDay.get(selectedDay) ?? [] : []

    return (
        <div className="w-full">
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
                        const count = tasksByDay.get(key)?.length ?? 0
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

                {/* TAREFAS DO DIA — reaproveita o InboxTaskCard e todas as
                    ações que ele já expõe (concluir, editar, tags, menu). */}
                <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {selectedDay
                            ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString(
                                'pt-BR',
                                { day: '2-digit', month: 'long' }
                            )
                            : 'Selecione um dia'}
                    </p>

                    {selectedTasks.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            Nenhuma tarefa planejada para este dia.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {selectedTasks.map((task) => (
                                <InboxTaskCard
                                    key={task.id}
                                    taskId={task.id}
                                    title={task.title}
                                    description={task.description}
                                    createdAt={task.createdAt}
                                    plannedDate={task.plannedDate}
                                    completedAt={task.completedAt}
                                    priority={task.priority}
                                    tags={task.tags}
                                    availableTags={availableTags}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
