'use client'

import { StudyTask, StudyTaskCard, StudyTag } from './study-task-card'

interface StudyKanbanProps {
    tasks: StudyTask[]
    availableTags: StudyTag[]
}

const COLUMNS: Array<{
    key: 'TODAY' | 'WEEK' | 'DOING' | 'DONE'
    title: string
    subtitle: string
}> = [
        {
            key: 'TODAY',
            title: 'Foco de hoje',
            subtitle: 'Priorize o que vai te aproximar da sua meta.',
        },
        {
            key: 'WEEK',
            title: 'Esta semana',
            subtitle: 'Continue evoluindo passo a passo.',
        },
        {
            key: 'DOING',
            title: 'Em revisão',
            subtitle: 'Fixe o conteúdo e consolide o aprendizado.',
        },
        {
            key: 'DONE',
            title: 'Concluído',
            subtitle: 'Conteúdo dominado. Ótimo trabalho!',
        },
    ]

export function StudyKanban({ tasks, availableTags }: StudyKanbanProps) {
    // BACKLOG entra junto de "Esta semana": para Estudos não faz
    // sentido uma 5ª coluna só pra tarefas sem data ainda — elas
    // continuam aparecendo, só agrupadas com as da semana.
    const grouped: Record<'TODAY' | 'WEEK' | 'DOING' | 'DONE', StudyTask[]> = {
        TODAY: [],
        WEEK: [],
        DOING: [],
        DONE: [],
    }

    for (const task of tasks) {
        if (task.status === 'BACKLOG') {
            grouped.WEEK.push(task)
        } else {
            grouped[task.status].push(task)
        }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => {
                const columnTasks = grouped[column.key]

                return (
                    <section
                        key={column.key}
                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {column.title}
                            </h2>
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                                {columnTasks.length}
                            </span>
                        </div>

                        <p className="mb-3 text-xs text-slate-500">
                            {column.subtitle}
                        </p>

                        <div className="space-y-3">
                            {columnTasks.length > 0 ? (
                                columnTasks.map((task) => (
                                    <StudyTaskCard
                                        key={task.id}
                                        task={task}
                                        availableTags={availableTags}
                                    />
                                ))
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
