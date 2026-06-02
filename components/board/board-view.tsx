'use client'

import {
    DndContext,
    closestCorners,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    horizontalListSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Board } from '@/db/schema/board'
import { ColumnCard } from './column-card'
import { CreateColumnButton } from './create-column-button'
import { useBoardDnd, ColumnWithCards } from './use-board-dnd'
import { LogoutButton } from '@/components/auth/logout-button'

interface BoardViewProps {
    board: Board
    columns: ColumnWithCards[]
}

export function BoardView({ board, columns: initialColumns }: BoardViewProps) {
    const { columns, handleDragEnd, handleDragStart, handleDragOver } =
        useBoardDnd(initialColumns)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    return (
        <div className="min-h-screen flex flex-col bg-[color:var(--background)]">
            <header className="border-b border-[color:var(--border)] bg-[color:var(--card)] px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="size-7 rounded-md bg-[color:var(--primary)] flex items-center justify-center">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="size-3.5 text-[color:var(--primary-foreground)]"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                x="3"
                                y="3"
                                width="7"
                                height="18"
                                rx="1.5"
                                fill="currentColor"
                            />
                            <rect
                                x="14"
                                y="3"
                                width="7"
                                height="11"
                                rx="1.5"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm text-[color:var(--foreground)] tracking-tight">
                        {board.title}
                    </span>
                </div>
                <LogoutButton />
            </header>

            <main className="flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columns.map((c) => c.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <div className="flex gap-3 p-6 h-full items-start min-w-max">
                            {columns.map((column) => (
                                <ColumnCard
                                    key={column.id}
                                    column={column}
                                    cards={column.cards}
                                />
                            ))}
                            <CreateColumnButton />
                        </div>
                    </SortableContext>
                </DndContext>
            </main>
        </div>
    )
}
