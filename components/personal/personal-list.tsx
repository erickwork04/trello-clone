'use client'

import { PersonalTask, PersonalTaskCard, PersonalTag } from './personal-task-card'
import {
    getPersonalGroup,
    PERSONAL_GROUP_LABELS,
    type PersonalGroup,
} from '@/lib/personal/group'

interface PersonalListProps {
    tasks: PersonalTask[]
    availableTags: PersonalTag[]
}

const GROUP_ORDER: PersonalGroup[] = [
    'routine',
    'health',
    'commitments',
    'completed',
]

export function PersonalList({ tasks, availableTags }: PersonalListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-slate-400">
                    Nenhuma tarefa pessoal encontrada.
                </p>
            </div>
        )
    }

    const groups: Record<PersonalGroup, PersonalTask[]> = {
        routine: [],
        health: [],
        commitments: [],
        completed: [],
    }

    for (const task of tasks) {
        groups[getPersonalGroup(task)].push(task)
    }

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {GROUP_ORDER.map((group) => {
                const groupTasks = groups[group]
                if (groupTasks.length === 0) return null

                return (
                    <div key={group}>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {PERSONAL_GROUP_LABELS[group]} ({groupTasks.length})
                        </p>

                        <div className="flex flex-col gap-2">
                            {groupTasks.map((task) => (
                                <PersonalTaskCard
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
