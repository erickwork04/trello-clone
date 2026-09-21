'use client'

import { useTransition } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { CalendarDays, Clock3, Star } from 'lucide-react'
import { toast } from 'sonner'

import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { toggleTopPriority } from '@/app/(app)/hoje/_actions/toggle-top-priority'
import { updateTaskStatus } from '@/app/(app)/hoje/_actions/update-task-status'
import { toggleTaskTag } from '@/app/(app)/hoje/_actions/toggle-task-tag'
import { TaskActions } from '@/components/dashboard/task-actions'

export type StudyStatus = 'BACKLOG' | 'WEEK' | 'TODAY' | 'DOING' | 'DONE'

export interface StudyTag {
    id: string
    name: string
    color: string
}

export interface StudyTask {
    id: string
    title: string
    description: string | null
    status: StudyStatus
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    isTopPriority: boolean
    plannedDate: Date | null
    plannedTime: string | null
    estimatedMinutes: number | null
    tags: StudyTag[]
}

const STATUS_LABELS: Record<'BACKLOG' | 'WEEK' | 'TODAY' | 'DOING', string> = {
    TODAY: 'Foco de hoje',
    WEEK: 'Esta semana',
    DOING: 'Em revisão',
    BACKLOG: 'Esta semana',
}

function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
}

interface StudyTaskCardProps {
    task: StudyTask
    availableTags: StudyTag[]
}

export function StudyTaskCard({ task, availableTags }: StudyTaskCardProps) {
    const [isPending, startTransition] = useTransition()
    const completed = task.status === 'DONE'

    const { execute: execStatus } = useAction(updateTaskStatus, {
        onError: () => toast.error('Erro ao mover a sessão.'),
    })

    const { execute: execToggleTag } = useAction(toggleTaskTag, {
        onError: () => toast.error('Erro ao atualizar tag.'),
    })

    function handleComplete() {
        if (isPending) return
        startTransition(async () => {
            await completeTask({
                taskId: task.id,
                completed,
                returnStatus: 'WEEK',
            })
        })
    }

    function handlePriority() {
        if (isPending) return
        startTransition(async () => {
            await toggleTopPriority({
                taskId: task.id,
                currentValue: task.isTopPriority,
            })
        })
    }

    const attachedIds = new Set(task.tags.map((t) => t.id))

    return (
        <article
            className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${
                isPending ? 'opacity-50' : 'hover:shadow-md'
            }`}
        >
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={completed}
                    disabled={isPending}
                    onChange={handleComplete}
                    className="mt-1 size-4 shrink-0 rounded"
                    aria-label={completed ? 'Reabrir sessão' : 'Concluir sessão'}
                />

                <div className="min-w-0 flex-1">
                    <p
                        className={`text-sm font-medium ${
                            completed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-900'
                        }`}
                    >
                        {task.title}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {task.tags.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                    execToggleTag({
                                        taskId: task.id,
                                        tagId: t.id,
                                        attach: false,
                                    })
                                }
                                title="Remover tag"
                                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
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
                            </button>
                        ))}

                        {availableTags.length > attachedIds.size && (
                            <TagPicker
                                availableTags={availableTags}
                                attachedIds={attachedIds}
                                onToggle={(tagId, attach) =>
                                    execToggleTag({
                                        taskId: task.id,
                                        tagId,
                                        attach,
                                    })
                                }
                            />
                        )}
                    </div>

                    {(task.plannedDate || task.estimatedMinutes) && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {task.plannedDate && (
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="size-3.5" />
                                    {task.plannedDate.toLocaleDateString(
                                        'pt-BR',
                                        { day: '2-digit', month: 'short' }
                                    )}
                                </span>
                            )}

                            {task.estimatedMinutes && (
                                <span className="flex items-center gap-1">
                                    <Clock3 className="size-3.5" />
                                    {formatDuration(task.estimatedMinutes)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePriority}
                        disabled={isPending || completed}
                        title="Prioridade máxima"
                        className={
                            task.isTopPriority
                                ? 'text-amber-500'
                                : 'text-slate-300 hover:text-amber-400'
                        }
                    >
                        <Star
                            className="size-4"
                            fill={task.isTopPriority ? 'currentColor' : 'none'}
                        />
                    </button>

                    {!completed && (
                        <select
                            value={task.status === 'DONE' ? 'WEEK' : task.status}
                            onChange={(e) =>
                                execStatus({
                                    taskId: task.id,
                                    status: e.target.value as
                                        | 'BACKLOG'
                                        | 'WEEK'
                                        | 'TODAY'
                                        | 'DOING',
                                })
                            }
                            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] text-slate-500 outline-none"
                            aria-label="Mover para etapa"
                        >
                            <option value="TODAY">{STATUS_LABELS.TODAY}</option>
                            <option value="WEEK">{STATUS_LABELS.WEEK}</option>
                            <option value="DOING">{STATUS_LABELS.DOING}</option>
                        </select>
                    )}

                    <TaskActions
                        taskId={task.id}
                        title={task.title}
                        description={task.description}
                        time={task.plannedTime}
                    />
                </div>
            </div>
        </article>
    )
}

function TagPicker({
    availableTags,
    attachedIds,
    onToggle,
}: {
    availableTags: StudyTag[]
    attachedIds: Set<string>
    onToggle: (tagId: string, attach: boolean) => void
}) {
    return (
        <details className="relative inline-block">
            <summary className="cursor-pointer list-none rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] text-slate-400 hover:bg-slate-50">
                + tag
            </summary>

            <div className="absolute left-0 top-full z-10 mt-1 flex w-40 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {availableTags.map((t) => {
                    const active = attachedIds.has(t.id)
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => onToggle(t.id, !active)}
                            className={`flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs ${
                                active
                                    ? 'bg-slate-50 font-medium text-slate-900'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                        </button>
                    )
                })}
            </div>
        </details>
    )
}
