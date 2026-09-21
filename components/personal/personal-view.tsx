'use client'

import { Suspense, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { PersonalTask, PersonalTag } from './personal-task-card'
import { PersonalKanban } from './personal-kanban'
import { PersonalList } from './personal-list'
import { PersonalCalendar } from './personal-calendar'
import {
    PersonalFilters,
    EMPTY_PERSONAL_FILTERS,
    type PersonalFilterState,
} from './personal-filters'
import { NewPersonalTaskButton } from './new-personal-task-button'
import { PersonalTagsManager } from './personal-tags-manager'
import { PersonalQuickTags } from './personal-quick-tags'

import { ViewSwitcher } from '@/components/shared/view-switcher'
import { useViewMode } from '@/components/shared/use-view-mode'

interface TagWithUsage extends PersonalTag {
    usageCount: number
}

interface PersonalViewProps {
    tasks: PersonalTask[]
    availableTags: PersonalTag[]
    allTagsWithUsage: TagWithUsage[]
}

/**
 * `useViewMode` usa `useSearchParams`, exigindo Suspense boundary —
 * mesmo padrão de board-view.tsx, inbox-view.tsx e study-view.tsx.
 */
export function PersonalView(props: PersonalViewProps) {
    return (
        <Suspense
            fallback={
                <PersonalKanban tasks={props.tasks} availableTags={props.availableTags} />
            }
        >
            <PersonalViewInner {...props} />
        </Suspense>
    )
}

function PersonalViewInner({
    tasks,
    availableTags,
    allTagsWithUsage,
}: PersonalViewProps) {
    const { view, setView, isMobile } = useViewMode()
    const [search, setSearch] = useState('')
    const [filters, setFilters] = useState<PersonalFilterState>(
        EMPTY_PERSONAL_FILTERS
    )

    // "Tags rápidas": só as que já aparecem em alguma tarefa Pessoal
    // carregada (opção 2 da auditoria) — derivado localmente, sem
    // query nova.
    const quickTags = useMemo(() => {
        const seen = new Map<string, PersonalTag>()
        for (const task of tasks) {
            for (const t of task.tags) {
                if (!seen.has(t.id)) seen.set(t.id, t)
            }
        }
        return Array.from(seen.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        )
    }, [tasks])

    function toggleQuickTag(tagId: string) {
        setFilters((current) => ({
            ...current,
            tagIds: current.tagIds.includes(tagId)
                ? current.tagIds.filter((id) => id !== tagId)
                : [...current.tagIds, tagId],
        }))
    }

    const filteredTasks = useMemo(() => {
        const term = search.trim().toLowerCase()

        return tasks.filter((task) => {
            if (term) {
                const matchesTitle = task.title.toLowerCase().includes(term)
                const matchesDescription = (task.description ?? '')
                    .toLowerCase()
                    .includes(term)
                const matchesTag = task.tags.some((t) =>
                    t.name.toLowerCase().includes(term)
                )

                if (!matchesTitle && !matchesDescription && !matchesTag) {
                    return false
                }
            }

            if (
                filters.statuses.length > 0 &&
                !filters.statuses.includes(
                    task.status === 'BACKLOG' ? 'TODAY' : task.status
                )
            ) {
                return false
            }

            if (
                filters.priorities.length > 0 &&
                !filters.priorities.includes(task.priority)
            ) {
                return false
            }

            if (filters.tagIds.length > 0) {
                const taskTagIds = task.tags.map((t) => t.id)
                if (!filters.tagIds.some((id) => taskTagIds.includes(id))) {
                    return false
                }
            }

            return true
        })
    }, [tasks, search, filters])

    return (
        <>
            {/* TOOLBAR */}
            <div className="mb-4 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <ViewSwitcher view={view} onChange={setView} isMobile={isMobile} />

                <div className="flex flex-1 flex-wrap justify-end gap-3">
                    <div className="flex h-11 w-full max-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                        <Search className="size-4 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar no pessoal..."
                            className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm"
                        />
                    </div>

                    <PersonalFilters
                        value={filters}
                        onChange={setFilters}
                        availableTags={availableTags}
                    />

                    <PersonalTagsManager tags={allTagsWithUsage} />

                    <NewPersonalTaskButton availableTags={availableTags} />
                </div>
            </div>

            {/* TAGS RÁPIDAS */}
            {quickTags.length > 0 && (
                <div className="mb-6">
                    <PersonalQuickTags
                        tags={quickTags}
                        selectedIds={filters.tagIds}
                        onToggle={toggleQuickTag}
                    />
                </div>
            )}

            {/* CONTEÚDO */}
            {view === 'board' && (
                <PersonalKanban tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'list' && (
                <PersonalList tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'calendar' && (
                <PersonalCalendar tasks={filteredTasks} availableTags={availableTags} />
            )}
        </>
    )
}
