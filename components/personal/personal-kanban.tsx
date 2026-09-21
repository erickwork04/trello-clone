'use client'

import { CheckCircle2 } from 'lucide-react'

import { PersonalTask, PersonalTaskCard, PersonalTag } from './personal-task-card'
import {
    getPersonalGroup,
    PERSONAL_GROUP_LABELS,
    PERSONAL_GROUP_SUBTITLES,
    type PersonalGroup,
} from '@/lib/personal/group'

interface PersonalKanbanProps {
    tasks: PersonalTask[]
    availableTags: PersonalTag[]
}

const COLUMN_ORDER: PersonalGroup[] = [
    'routine',
    'health',
    'commitments',
    'completed',
]

const COLUMN_ACCENT: Record<PersonalGroup, string> = {
    routine: 'bg-blue-500',
    health: 'bg-emerald-500',
    commitments: 'bg-amber-500',
    completed: 'bg-slate-400',
}

export function PersonalKanban({ tasks, availableTags }: PersonalKanbanProps) {
    const grouped: Record<PersonalGroup, PersonalTask[]> = {
        routine: [],
        health: [],
        commitments: [],
        completed: [],
    }

    for (const task of tasks) {
        grouped[getPersonalGroup(task)].push(task)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMN_ORDER.map((group) => {
                const columnTasks = grouped[group]

                return (
                    <section
                        key={group}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <span
                                className={`size-2 rounded-full ${COLUMN_ACCENT[group]}`}
                            />
                            <h2 className="text-sm font-semibold text-slate-900">
                                {PERSONAL_GROUP_LABELS[group]}
                            </h2>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                                {columnTasks.length}
                            </span>
                        </div>

                        <p className="mb-3 text-xs text-slate-500">
                            {PERSONAL_GROUP_SUBTITLES[group]}
                        </p>

                        <div className="space-y-3">
                            {columnTasks.length > 0 ? (
                                columnTasks.map((task) => (
                                    <PersonalTaskCard
                                        key={task.id}
                                        task={task}
                                        availableTags={availableTags}
                                    />
                                ))
                            ) : group === 'completed' ? (
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
                                    <CheckCircle2 className="size-8 text-emerald-400" />
                                    <p className="text-sm font-medium text-slate-700">
                                        Tudo em dia por aqui!
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Continue cuidando das suas conquistas.
                                        Você está indo bem.
                                    </p>
                                    <p className="mt-1 text-[11px] italic text-blue-500">
                                        &ldquo;Equilíbrio hoje, mais conquistas
                                        amanhã.&rdquo;
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">
                                    Nada por aqui.
                                </div>
                            )}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
