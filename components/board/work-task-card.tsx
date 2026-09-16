'use client'

import { useTransition } from 'react'
import {
    CalendarDays,
    Clock3,
} from 'lucide-react'

import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { TaskActions } from '@/components/dashboard/task-actions'

interface WorkTaskCardProps {
    task: {
        id: string
        title: string
        description: string | null
        priority: 'LOW' | 'MEDIUM' | 'HIGH'
        plannedDate: Date | null
        plannedTime: string | null

        status:
        | 'BACKLOG'
        | 'WEEK'
        | 'TODAY'
        | 'DOING'
        | 'DONE'
        | 'CANCELED'
    }
}

const priorityLabel = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
}

const priorityClass = {
    LOW: 'bg-emerald-50 text-emerald-600',
    MEDIUM: 'bg-amber-50 text-amber-600',
    HIGH: 'bg-red-50 text-red-600',
}

export function WorkTaskCard({
    task,
}: WorkTaskCardProps) {
    const [isPending, startTransition] =
        useTransition()

    const completed =
        task.status === 'DONE'

    function handleComplete() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            await completeTask(
                task.id,
                completed,
                'BACKLOG'
            )
        })
    }

    return (
        <article
            className={[
                'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition',
                isPending
                    ? 'opacity-50'
                    : 'hover:shadow-md',
            ].join(' ')}
        >
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={completed}
                    disabled={isPending}
                    onChange={handleComplete}
                    className="mt-1 size-4 shrink-0 rounded"
                />

                <div className="min-w-0 flex-1">
                    <p
                        className={[
                            'text-sm font-semibold',
                            completed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-800',
                        ].join(' ')}
                    >
                        {task.title}
                    </p>

                    {task.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {task.description}
                        </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                            Trabalho
                        </span>

                        <span
                            className={[
                                'rounded-full px-2 py-1 text-xs',
                                priorityClass[
                                task.priority
                                ],
                            ].join(' ')}
                        >
                            {
                                priorityLabel[
                                task.priority
                                ]
                            }
                        </span>
                    </div>

                    {(task.plannedDate ||
                        task.plannedTime) && (
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                {task.plannedDate && (
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3.5" />

                                        {task.plannedDate.toLocaleDateString(
                                            'pt-BR'
                                        )}
                                    </span>
                                )}

                                {task.plannedTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock3 className="size-3.5" />

                                        {task.plannedTime.slice(
                                            0,
                                            5
                                        )}
                                    </span>
                                )}
                            </div>
                        )}
                </div>

                <TaskActions
                    taskId={task.id}
                    title={task.title}
                    description={
                        task.description
                    }
                    time={
                        task.plannedTime
                    }
                />
            </div>
        </article>
    )
}