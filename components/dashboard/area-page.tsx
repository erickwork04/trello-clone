import { TaskRow } from './task-row'

interface AreaPageProps {
    title: string
    description: string
    tasks: {
        id: string
        title: string
        area: 'Trabalho' | 'Estudos' | 'Pessoal'
        completed: boolean
        topPriority: boolean
    }[]
}

export function AreaPage({
    title,
    description,
    tasks,
}: AreaPageProps) {
    return (
        <div className="h-full overflow-y-auto">
            <div className="w-full px-8 py-6 2xl:px-10">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {title}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {description}
                    </p>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {tasks.length > 0 ? (
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                            {tasks.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    id={task.id}
                                    title={task.title}
                                    area={task.area}
                                    completed={task.completed}
                                    topPriority={task.topPriority}
                                    allowPriority={!task.completed}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
                            <p className="text-sm text-slate-500">
                                Nenhuma tarefa encontrada.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}