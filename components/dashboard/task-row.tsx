'use client'

import { useTransition } from 'react'
import { Clock3, MoreVertical, Star } from 'lucide-react'
import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { AreaBadge } from './area-badge'
import { toggleTopPriority } from '@/app/(app)/hoje/_actions/toggle-top-priority'

interface TaskRowProps {
    id: string
    title: string
    description?: string | null
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
    time?: string | null
    completed?: boolean
    topPriority?: boolean
    allowPriority?: boolean
}

export function TaskRow({
    id,
    title,
    description,
    area,
    time,
    completed = false,
    topPriority = false,
    allowPriority = false
}: TaskRowProps) {
    const [isPending, startTransition] = useTransition()

    function handlePriority() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            await toggleTopPriority(id, topPriority)
        })
    }

    function handleComplete() {
        if (completed || isPending) {
            return
        }

        startTransition(async () => {
            await completeTask(id)
        })
    }

    return (
        <div
            className={[
                'flex items-start gap-3 p-3',
                isPending ? 'opacity-50' : '',
            ].join(' ')}
        >
            <input
                type="checkbox"
                checked={completed}
                disabled={isPending}
                onChange={handleComplete}
                readOnly={completed}
                className="mt-1 size-4 shrink-0 rounded border-slate-300"
            />

            <div className="min-w-0 flex-1">
                <p
                    className={[
                        'text-sm',
                        completed
                            ? 'text-slate-400 line-through'
                            : 'font-medium text-slate-800',
                    ].join(' ')}
                >
                    {title}
                </p>

                {description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {allowPriority && !completed && (
                        <button
                            type="button"
                            onClick={handlePriority}
                            disabled={isPending}
                            title={
                                topPriority
                                    ? 'Remover das prioridades'
                                    : 'Adicionar às prioridades'
                            }
                        >
                            <Star
                                className={[
                                    'size-4 transition',
                                    topPriority
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 hover:text-amber-400',
                                ].join(' ')}
                            />
                        </button>
                    )}

                    <AreaBadge area={area} />

                    {time && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock3 className="size-3.5" />
                            {time.slice(0, 5)}
                        </span>
                    )}
                </div>
            </div>

            <button
                type="button"
                className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Opções"
            >
                <MoreVertical className="size-4" />
            </button>
        </div>
    )
}