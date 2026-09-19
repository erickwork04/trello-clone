'use client'

import { Suspense, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Task } from '@/db/schema/task'

import { InboxBoard } from '@/components/dashboard/inbox-board'
import { InboxList } from '@/components/dashboard/inbox-list'
import { InboxCalendar } from '@/components/dashboard/inbox-calendar'
import { NewInboxTaskButton } from '@/components/dashboard/new-inbox-task-button'
import {
    InboxFilters,
    EMPTY_INBOX_FILTERS,
    type InboxFilterState,
} from '@/components/dashboard/inbox-filters'

import { ViewSwitcher } from '@/components/shared/view-switcher'
import { useViewMode } from '@/components/shared/use-view-mode'

interface TaskTag {
    id: string
    name: string
    color: string
}

export interface InboxTaskWithTags extends Task {
    tags: TaskTag[]
}

interface InboxViewProps {
    tasks: InboxTaskWithTags[]
    availableTags: TaskTag[]
}

/**
 * `useViewMode` usa `useSearchParams`, exigindo Suspense boundary —
 * mesmo motivo/padrão de components/board/board-view.tsx.
 */
export function InboxView(props: InboxViewProps) {
    return (
        <Suspense
            fallback={
                <InboxBoard tasks={props.tasks} availableTags={props.availableTags} />
            }
        >
            <InboxViewInner {...props} />
        </Suspense>
    )
}

function InboxViewInner({ tasks, availableTags }: InboxViewProps) {
    const { view, setView, isMobile } = useViewMode()
    const [search, setSearch] = useState('')
    const [filters, setFilters] = useState<InboxFilterState>(EMPTY_INBOX_FILTERS)

    const filteredTasks = useMemo(() => {
        const term = search.trim().toLowerCase()

        return tasks.filter((task) => {
            if (term) {
                const matchesTitle = task.title.toLowerCase().includes(term)
                const matchesDescription = (task.description ?? '')
                    .toLowerCase()
                    .includes(term)

                if (!matchesTitle && !matchesDescription) return false
            }

            if (
                filters.priorities.length > 0 &&
                !filters.priorities.includes(task.priority)
            ) {
                return false
            }

            if (
                filters.stages.length > 0 &&
                !filters.stages.includes(task.inboxStage)
            ) {
                return false
            }

            if (filters.tagIds.length > 0) {
                const taskTagIds = task.tags.map((t) => t.id)
                const hasMatch = filters.tagIds.some((id) =>
                    taskTagIds.includes(id)
                )
                if (!hasMatch) return false
            }

            return true
        })
    }, [tasks, search, filters])

    return (
        <>
            {/* TOOLBAR */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <ViewSwitcher view={view} onChange={setView} isMobile={isMobile} />

                <div className="flex flex-1 flex-wrap justify-end gap-3">
                    <div className="flex h-11 w-full max-w-[320px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                        <Search className="size-4 shrink-0 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar na caixa de entrada..."
                            className="h-full w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm"
                        />
                    </div>

                    <InboxFilters
                        value={filters}
                        onChange={setFilters}
                        availableTags={availableTags}
                    />

                    <NewInboxTaskButton tags={availableTags} />
                </div>
            </div>

            {/* CONTEÚDO */}
            {view === 'board' && (
                <InboxBoard tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'list' && (
                <InboxList tasks={filteredTasks} availableTags={availableTags} />
            )}

            {view === 'calendar' && (
                <InboxCalendar tasks={filteredTasks} availableTags={availableTags} />
            )}
        </>
    )
}
