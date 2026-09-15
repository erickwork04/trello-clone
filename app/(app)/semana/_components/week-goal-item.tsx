'use client'

import { useTransition } from 'react'

import { toggleWeekGoal } from '../_actions/toggle-week-goal'

interface WeekGoalItemProps {
    id: string
    title: string
    completed: boolean
}

export function WeekGoalItem({
    id,
    title,
    completed,
}: WeekGoalItemProps) {
    const [isPending, startTransition] =
        useTransition()

    function handleToggle() {
        startTransition(async () => {
            await toggleWeekGoal(
                id,
                !completed,
            )
        })
    }

    return (
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0">
            <button
                type="button"
                disabled={isPending}
                onClick={handleToggle}
                className={[
                    'flex size-5 shrink-0 items-center justify-center rounded border transition',
                    completed
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white hover:border-blue-400',
                    isPending
                        ? 'opacity-50'
                        : '',
                ].join(' ')}
            >
                {completed && (
                    <span className="text-xs font-bold">
                        ✓
                    </span>
                )}
            </button>

            <p
                className={[
                    'flex-1 text-sm',
                    completed
                        ? 'text-slate-400 line-through'
                        : 'text-[#071958]',
                ].join(' ')}
            >
                {title}
            </p>
        </div>
    )
}