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

interface BoardViewProps {
    board: Board
    columns: ColumnWithCards[]
}

export function BoardView({
    board,
    columns: initialColumns,
}: BoardViewProps) {
    const {
        columns,
        handleDragEnd,
        handleDragStart,
        handleDragOver,
    } = useBoardDnd(initialColumns)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),

        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    return (
        <div className="flex h-full min-w-0 flex-col bg-[color:var(--background)]">
            <div className="shrink-0 px-6 pt-6">
                <h1 className="text-2xl font-semibold text-[color:var(--foreground)]">
                    Trabalho
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Organize suas tarefas e mantenha o foco no que importa.
                </p>
            </div>

            <main className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columns.map((column) => column.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        <div className="flex h-full min-w-max items-start gap-3 p-6">
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