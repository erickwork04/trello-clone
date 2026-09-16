'use client'

import {
    Briefcase,
    CheckCircle2,
    CircleAlert,
    PlayCircle,
    Search,
    SlidersHorizontal,
} from 'lucide-react'

import { WorkColumn } from './work-column'

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

interface WorkBoardViewProps {
    backlog: TaskItem[]
    week: TaskItem[]
    doing: TaskItem[]
    done: TaskItem[]
}

export function WorkBoardView({
    backlog,
    week,
    doing,
    done,
}: WorkBoardViewProps) {
    const highPriorityCount = [
        ...backlog,
        ...week,
        ...doing,
    ].filter(
        (task) => task.priority === 'HIGH'
    ).length

    return (
        <div className="h-full overflow-y-auto bg-slate-50">
            <div className="px-8 py-6">

                {/* TOPO */}
                <div className="mb-6 flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                            <Briefcase className="size-6" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Trabalho
                            </h1>

                            <p className="mt-1 text-base text-slate-500">
                                Mais foco e execução para o que importa.
                            </p>

                            <p className="mt-3 text-sm text-slate-400">
                                Organize suas tarefas, mantenha o foco no essencial e avance projeto por projeto. 🚀
                            </p>
                        </div>
                    </div>

                    <div className="hidden rounded-2xl bg-blue-50 px-6 py-4 text-blue-600 xl:block">
                        <p className="text-lg italic">
                            “Disciplina hoje, resultados amanhã.”
                        </p>
                    </div>
                </div>

                {/* RESUMOS */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <PlayCircle className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Em andamento
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {doing.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Finalizadas
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {done.length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <CircleAlert className="size-5" />
                            </div>

                            <div>
                                <p className="text-sm text-slate-500">
                                    Prioridade máxima
                                </p>

                                <p className="text-2xl font-bold text-slate-900">
                                    {highPriorityCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BARRA */}
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                        <button className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
                            Quadro
                        </button>

                        <button className="px-4 py-2 text-sm text-slate-500">
                            Lista
                        </button>

                        <button className="px-4 py-2 text-sm text-slate-500">
                            Calendário
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex min-w-60 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                            <Search className="size-4 text-slate-400" />

                            <input
                                placeholder="Buscar tarefa..."
                                className="h-10 w-full bg-transparent text-sm outline-none"
                            />
                        </div>

                        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                            <SlidersHorizontal className="size-4" />
                            Filtros
                        </button>

                        <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            + Nova tarefa
                        </button>
                    </div>
                </div>

                {/* KANBAN */}
                <div className="grid gap-4 xl:grid-cols-4">
                    <WorkColumn
                        title="Backlog"
                        subtitle="Ideias e tarefas para fazer depois."
                        tasks={backlog}
                        tone="slate"
                    />

                    <WorkColumn
                        title="Esta semana"
                        subtitle="Tarefas para focar nesta semana."
                        tasks={week}
                        tone="blue"
                    />

                    <WorkColumn
                        title="Fazendo"
                        subtitle="Mantenha o essencial aqui."
                        tasks={doing}
                        tone="amber"
                    />

                    <WorkColumn
                        title="Concluído"
                        subtitle="Tarefas finalizadas recentemente."
                        tasks={done}
                        tone="emerald"
                    />
                </div>
            </div>
        </div>
    )
}