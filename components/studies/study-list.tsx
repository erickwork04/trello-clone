'use client'

import { StudyTask, StudyTaskCard, StudyTag } from './study-task-card'

interface StudyListProps {
    tasks: StudyTask[]
    availableTags: StudyTag[]
}

const GROUP_LABELS: Record<'TODAY' | 'WEEK' | 'DOING' | 'DONE', string> = {
    TODAY: 'Foco de hoje',
    WEEK: 'Esta semana',
    DOING: 'Em revisão',
    DONE: 'Concluído',
}

export function StudyList({ tasks, availableTags }: StudyListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-slate-400">
                    Nenhuma sessão de estudo encontrada.
                </p>
            </div>
        )
    }

    const groups: Record<'TODAY' | 'WEEK' | 'DOING' | 'DONE', StudyTask[]> = {
        TODAY: [],
        WEEK: [],
        DOING: [],
        DONE: [],
    }

    for (const task of tasks) {
        const key = task.status === 'BACKLOG' ? 'WEEK' : task.status
        groups[key].push(task)
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {(['TODAY', 'WEEK', 'DOING', 'DONE'] as const).map((key) => {
                const groupTasks = groups[key]
                if (groupTasks.length === 0) return null

                return (
                    <div key={key}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {GROUP_LABELS[key]} ({groupTasks.length})
                        </p>

                        <div className="flex flex-col gap-2">
                            {groupTasks.map((task) => (
                                <StudyTaskCard
                                    key={task.id}
                                    task={task}
                                    availableTags={availableTags}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
