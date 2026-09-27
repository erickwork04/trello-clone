'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { ConcludedTask, ConcludedTaskCard } from './concluded-task-card'

interface ConcludedViewProps {
    tasks: ConcludedTask[]
}

const AREA_OPTIONS: Array<{ value: ConcludedTask['area']; label: string }> = [
    { value: 'Trabalho', label: 'Trabalho' },
    { value: 'Estudos', label: 'Estudos' },
    { value: 'Pessoal', label: 'Pessoal' },
]

export function ConcludedView({ tasks }: ConcludedViewProps) {
    const [search, setSearch] = useState('')
    const [areaFilter, setAreaFilter] = useState<ConcludedTask['area'] | null>(
        null
    )

    const filteredTasks = useMemo(() => {
        const term = search.trim().toLowerCase()

        return tasks.filter((task) => {
            if (areaFilter && task.area !== areaFilter) return false

            if (term) {
                const matchesTitle = task.title.toLowerCase().includes(term)
                const matchesDescription = (task.description ?? '')
                    .toLowerCase()
                    .includes(term)
                if (!matchesTitle && !matchesDescription) return false
            }

            return true
        })
    }, [tasks, search, areaFilter])

    return (
        <>
            {/* CONTROLES */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 sm:max-w-[280px]">
                    <Search className="size-4 shrink-0 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar nas concluídas..."
                        className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setAreaFilter(null)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            areaFilter === null
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Todas
                    </button>

                    {AREA_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                                setAreaFilter(
                                    areaFilter === option.value
                                        ? null
                                        : option.value
                                )
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                areaFilter === option.value
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* LISTA */}
            {filteredTasks.length === 0 ? (
                <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center">
                    <p className="text-sm font-medium text-slate-600">
                        {tasks.length === 0
                            ? 'Nenhuma tarefa concluída ainda.'
                            : 'Nenhuma tarefa encontrada.'}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        {tasks.length === 0
                            ? 'Quando você concluir tarefas, elas aparecem aqui.'
                            : 'Tente ajustar a busca ou o filtro.'}
                    </p>
                </div>
            ) : (
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                    {filteredTasks.map((task) => (
                        <ConcludedTaskCard key={task.id} task={task} />
                    ))}
                </div>
            )}
        </>
    )
}
