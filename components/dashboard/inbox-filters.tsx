'use client'

import { SlidersHorizontal } from 'lucide-react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export type InboxStage = 'ARRIVED' | 'ORGANIZE' | 'NEXT' | 'ORGANIZED'
export type InboxPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface InboxFilterState {
    priorities: InboxPriority[]
    stages: InboxStage[]
    tagIds: string[]
}

export const EMPTY_INBOX_FILTERS: InboxFilterState = {
    priorities: [],
    stages: [],
    tagIds: [],
}

const PRIORITY_LABELS: Record<InboxPriority, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
}

const STAGE_LABELS: Record<InboxStage, string> = {
    ARRIVED: 'Chegou agora',
    ORGANIZE: 'Para organizar',
    NEXT: 'Próximos passos',
    ORGANIZED: 'Organizada',
}

interface InboxFiltersProps {
    value: InboxFilterState
    onChange: (value: InboxFilterState) => void
    availableTags: Array<{ id: string; name: string; color: string }>
}

function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item]
}

export function InboxFilters({
    value,
    onChange,
    availableTags,
}: InboxFiltersProps) {
    const activeCount =
        value.priorities.length + value.stages.length + value.tagIds.length

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
                        Prioridade
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(PRIORITY_LABELS) as InboxPriority[]).map(
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

                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Estágio
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(STAGE_LABELS) as InboxStage[]).map(
                            (stage) => {
                                const active = value.stages.includes(stage)
                                return (
                                    <button
                                        key={stage}
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...value,
                                                stages: toggle(
                                                    value.stages,
                                                    stage
                                                ),
                                            })
                                        }
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                            active
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {STAGE_LABELS[stage]}
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
                                                tagIds: toggle(
                                                    value.tagIds,
                                                    t.id
                                                ),
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
                        onClick={() => onChange(EMPTY_INBOX_FILTERS)}
                        className="text-xs font-medium text-slate-400 hover:text-slate-700"
                    >
                        Limpar filtros
                    </button>
                )}
            </PopoverContent>
        </Popover>
    )
}
