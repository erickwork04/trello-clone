import { WorkTaskCard } from './work-task-card'

interface TaskItem {
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

interface WorkColumnProps {
    title: string
    subtitle: string
    tasks: TaskItem[]
    tone:
    | 'slate'
    | 'blue'
    | 'amber'
    | 'emerald'
}

const toneClass = {
    slate: 'bg-slate-400',
    blue: 'bg-blue-500',
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-500',
}

export function WorkColumn({
    title,
    subtitle,
    tasks,
    tone,
}: WorkColumnProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-100/60 p-3">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`size-3 rounded-full ${toneClass[tone]}`}
                        />

                        <h2 className="font-semibold text-slate-900">
                            {title}
                        </h2>

                        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                            {tasks.length}
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                        {subtitle}
                    </p>
                </div>

                <button className="text-slate-400">
                    ⋯
                </button>
            </div>

            <div className="space-y-3">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <WorkTaskCard
                            key={task.id}
                            task={task}
                        />
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-400">
                        Sem tarefas
                    </div>
                )}
            </div>

            <button className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm text-blue-600 hover:bg-white">
                + Nova tarefa
            </button>
        </section>
    )
}