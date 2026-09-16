'use client'

import { useMemo, useState } from 'react'

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

import {
    Briefcase,
    Search,
    SlidersHorizontal,
    PlayCircle,
    CheckCircle2,
    CircleAlert,
    Quote,
} from 'lucide-react'

import { Board } from '@/db/schema/board'

import { ColumnCard } from './column-card'
import { CreateColumnButton } from './create-column-button'

import {
    useBoardDnd,
    ColumnWithCards,
} from './use-board-dnd'

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

    const [search, setSearch] =
        useState('')

    const [showFilters, setShowFilters] =
        useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),

        useSensor(KeyboardSensor, {
            coordinateGetter:
                sortableKeyboardCoordinates,
        })
    )

    const filteredColumns = useMemo(() => {
        const term = search
            .trim()
            .toLowerCase()

        if (!term) {
            return columns
        }

        return columns.map((column) => ({
            ...column,
            cards: column.cards.filter((card) =>
                card.name
                    .toLowerCase()
                    .includes(term)
            ),
        }))
    }, [columns, search])

    const totalCards = columns.reduce(
        (total, column) =>
            total + column.cards.length,
        0
    )

    const inProgressCards = columns
        .filter(
            (column) =>
                column.type === 'IN_PROGRESS'
        )
        .reduce(
            (total, column) =>
                total + column.cards.length,
            0
        )

    const completedCards = columns
        .filter(
            (column) =>
                column.type === 'DONE'
        )
        .reduce(
            (total, column) =>
                total + column.cards.length,
            0
        )

    return (
        <div className="flex h-full min-w-0 flex-col bg-slate-50">

            {/* TOPO */}
            <div className="shrink-0 px-6 pt-5">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                    {/* ESQUERDA */}
                    <div className="min-w-0">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <Briefcase className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Trabalho
                                </h1>

                                <p className="text-sm text-slate-500">
                                    Mais foco e execução para o que importa.
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-slate-600">
                            Organize suas tarefas, mantenha o foco no essencial e avance projeto por projeto. 🚀
                        </p>
                    </div>

                    {/* DIREITA */}
                    <div className="flex flex-wrap items-stretch gap-3">

                        <div className="hidden max-w-47.5 rounded-xl bg-blue-50 px-4 py-3 text-blue-600 xl:block">
                            <p className="text-sm italic">
                                “Disciplina hoje, resultados amanhã.”
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Em andamento
                            </p>

                            <p className="text-xl font-bold text-slate-900">
                                {inProgressCards}
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Finalizadas
                            </p>

                            <p className="text-xl font-bold text-slate-900">
                                {completedCards}
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Prioridade máxima
                            </p>

                            <p className="text-xl font-bold text-slate-900">
                                0
                            </p>
                        </div>
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">

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
                        {/* busca / filtros / nova tarefa */}
                    </div>
                </div>
            </div>

            {/* BOARD */}
            <main className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={
                        closestCorners
                    }
                    onDragStart={
                        handleDragStart
                    }
                    onDragOver={
                        handleDragOver
                    }
                    onDragEnd={
                        handleDragEnd
                    }
                >
                    <SortableContext
                        items={filteredColumns.map(
                            (column) =>
                                column.id
                        )}
                        strategy={
                            horizontalListSortingStrategy
                        }
                    >
                        <div className="flex h-full min-w-max items-start gap-3 p-6 pt-5">

                            {filteredColumns.map(
                                (column) => (
                                    <ColumnCard
                                        key={
                                            column.id
                                        }
                                        column={
                                            column
                                        }
                                        cards={
                                            column.cards
                                        }
                                    />
                                )
                            )}

                            {/* VOLTA A CRIAÇÃO DE COLUNA */}
                            <CreateColumnButton />
                        </div>
                    </SortableContext>
                </DndContext>
            </main>
        </div>
    )
}