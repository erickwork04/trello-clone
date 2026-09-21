'use client'

import { Suspense, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { StudyTask, StudyTag } from './study-task-card'
import { StudyKanban } from './study-kanban'
import { StudyList } from './study-list'
import { StudyCalendar } from './study-calendar'
import {
    StudyFilters,
    EMPTY_STUDY_FILTERS,
    type StudyFilterState,
} from './study-filters'
import { NewStudySessionButton } from './new-study-session-button'

import { ViewSwitcher } from '@/components/shared/view-switcher'
import { useViewMode } from '@/components/shared/use-view-mode'

interface StudyViewProps {
    tasks: StudyTask[]
    availableTags: StudyTag[]
}

/**
 * `useViewMode` usa `useSearchParams`, exigindo Suspense boundary —
 * mesmo padrão de board-view.tsx e inbox-view.tsx.
 */
export function StudyView(props: StudyViewProps) {
    return (
        <Suspense
            fallback={
                <StudyKanban tasks={props.tasks} availableTags={props.availableTags} />
            }
        >
            <StudyViewInner {...props} />
        </Suspense>
    )
}

function StudyViewInner({ tasks, availableTags }: StudyViewProps) {
    const { view, setView, isMobile } = useViewMode()
    const [search, setSearch] = useState('')
    const [filters, setFilters] = useState<StudyFilterState>(EMPTY_STUDY_FILTERS)

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
                    task.status === 'BACKLOG' ? 'WEEK' : task.status
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
            <div className="mb-6 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
                <ViewSwitcher view={view} onChange={setView} isMobile={isMobile} />

                <div className="flex flex-1 flex-wrap justify-end gap-3">
                    <div className="flex h-11 w-full max-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                        <Search className="size-4 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar nos estudos..."
                            className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm"
                        />
                    </div>

                    <StudyFilters
                        value={filters}
                        onChange={setFilters}
                        availableTags={availableTags}
                    />

                    <NewStudySessionButton availableTags={availableTags} />
                </div>
            </div>

            {/* CONTEÚDO */}
            {view === 'board' && (
                <StudyKanban tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'list' && (
                <StudyList tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'calendar' && (
                <StudyCalendar tasks={filteredTasks} availableTags={availableTags} />
            )}
        </>
    )
}
