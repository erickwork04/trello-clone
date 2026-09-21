'use client'

import { SlidersHorizontal } from 'lucide-react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export type StudyStatusFilter = 'TODAY' | 'WEEK' | 'DOING' | 'DONE'
export type StudyPriorityFilter = 'LOW' | 'MEDIUM' | 'HIGH'

export interface StudyFilterState {
    statuses: StudyStatusFilter[]
    priorities: StudyPriorityFilter[]
    tagIds: string[]
}

export const EMPTY_STUDY_FILTERS: StudyFilterState = {
    statuses: [],
    priorities: [],
    tagIds: [],
}

const STATUS_LABELS: Record<StudyStatusFilter, string> = {
    TODAY: 'Foco de hoje',
    WEEK: 'Esta semana',
    DOING: 'Em revisão',
    DONE: 'Concluído',
}

const PRIORITY_LABELS: Record<StudyPriorityFilter, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
}

interface StudyFiltersProps {
    value: StudyFilterState
    onChange: (value: StudyFilterState) => void
    availableTags: Array<{ id: string; name: string; color: string }>
}

function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item]
}

export function StudyFilters({
    value,
    onChange,
    availableTags,
}: StudyFiltersProps) {
    const activeCount =
        value.statuses.length + value.priorities.length + value.tagIds.length

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="flex h-11 items-center gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    <SlidersHorizontal className="size-4" />
                    Filtros
                    {activeCount > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                            {activeCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-72 space-y-4 p-4">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Etapa
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(STATUS_LABELS) as StudyStatusFilter[]).map(
                            (status) => {
                                const active = value.statuses.includes(status)
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                statuses: toggle(
                                                    value.statuses,
                                                    status
                                                ),
                                            })
                                        }
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {STATUS_LABELS[status]}
                                    </button>
                                )
                            }
                        )}
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Prioridade
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(PRIORITY_LABELS) as StudyPriorityFilter[]).map(
                            (priority) => {
                                const active = value.priorities.includes(priority)
                                return (
                                    <button
                                        key={priority}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                priorities: toggle(
                                                    value.priorities,
                                                    priority
                                                ),
                                            })
                                        }
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {PRIORITY_LABELS[priority]}
                                    </button>
                                )
                            }
                        )}
                    </div>
                </div>

                {availableTags.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map((t) => {
                                const active = value.tagIds.includes(t.id)
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                tagIds: toggle(value.tagIds, t.id),
                                            })
                                        }
                                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                    </div>
                )}

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={() => onChange(EMPTY_STUDY_FILTERS)}
                        className="text-xs font-medium text-slate-400 hover:text-slate-700"
                    >
                        Limpar filtros
                    </button>
                )}
            </PopoverContent>
        </Popover>
    )
}
