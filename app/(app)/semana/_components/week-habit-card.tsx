'use client'

import { useTransition } from 'react'

import { toggleHabit } from '../_actions/toggle-habit'

interface WeekHabitCardProps {
    id: string
    title: string
    targetDays: number
    weekStart: string
    checks: {
        id: string
        date: Date
        completed: boolean
    }[]
}

function getDateKey(date: Date) {
    return date
        .toISOString()
        .slice(0, 10)
}

export function WeekHabitCard({
    id,
    title,
    targetDays,
    weekStart,
    checks,
}: WeekHabitCardProps) {
    const [isPending, startTransition] =
        useTransition()

    const start = new Date(
        `${weekStart}T00:00:00`,
    )

    const days = Array.from(
        { length: 7 },
        (_, index) => {
            const date = new Date(start)

            date.setDate(
                date.getDate() + index,
            )

            return date
        },
    )

    const completedCount =
        checks.filter(
            (check) => check.completed,
        ).length

    function handleToggle(
        date: Date,
    ) {
        startTransition(async () => {
            await toggleHabit({
                habitId: id,
                date: getDateKey(date),
            })
        })
    }

    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-[#071958]">
                {title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
                {completedCount} de{' '}
                {targetDays} dias
            </p>

            <div className="mt-4 flex gap-2">
                {days.map((day) => {
                    const dayKey =
                        getDateKey(day)

                    const done =
                        checks.some(
                            (check) =>
                                check.completed &&
                                getDateKey(
                                    check.date,
                                ) ===
                                dayKey,
                        )

                    return (
                        <button
                            key={dayKey}
                            type="button"
                            disabled={
                                isPending
                            }
                            onClick={() =>
                                handleToggle(
                                    day,
                                )
                            }
                            title={day.toLocaleDateString(
                                'pt-BR',
                                {
                                    weekday:
                                        'long',
                                    day: '2-digit',
                                    month: '2-digit',
                                },
                            )}
                            className={[
                                'flex size-6 items-center justify-center rounded-full border text-[10px] transition',
                                done
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50',
                                isPending
                                    ? 'opacity-50'
                                    : '',
                            ].join(
                                ' ',
                            )}
                        >
                            {done && '✓'}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}