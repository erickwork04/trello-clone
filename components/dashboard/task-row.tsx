'use client'

import { useTransition } from 'react'
import { Clock3 } from 'lucide-react'
import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { AreaBadge } from './area-badge'
import { Star } from 'lucide-react'
import { toggleTopPriority } from '@/app/(app)/hoje/_actions/toggle-top-priority'

interface TaskRowProps {
    id: string
    title: string
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
    time?: string
    completed?: boolean
    topPriority?: boolean
    allowPriority?: boolean
}

export function TaskRow({
    id,
    title,
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
                'flex items-center gap-3 p-3',
                isPending ? 'opacity-50' : '',
            ].join(' ')}
        >
            <input
                type="checkbox"
                checked={completed}
                disabled={isPending}
                onChange={handleComplete}
                readOnly={completed}
                className="size-4 rounded border-slate-300"
            />

            <span
                className={[
                    'min-w-0 flex-1 text-sm',
                    completed
                        ? 'text-slate-400 line-through'
                        : 'font-medium text-slate-800',
                ].join(' ')}
            >
                {title}
            </span>
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

            <div className="hidden sm:block">
                <AreaBadge area={area} />
            </div>

            {time && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="size-3.5" />
                    {time}
                </span>
            )}
        </div>
    )
}