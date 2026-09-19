'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'

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

import { Briefcase } from 'lucide-react'

import { Board } from '@/db/schema/board'

import { ColumnCard } from './column-card'
import { CreateColumnButton } from './create-column-button'
import { CardDetailsPanel } from './card-details-panel'
import { BoardList } from './board-list'
import { BoardCalendar } from './board-calendar'

import {
    useBoardDnd,
    ColumnWithCards,
    CardTagOption,
} from './use-board-dnd'

import { ViewSwitcher } from '@/components/shared/view-switcher'
import { useViewMode } from '@/components/shared/use-view-mode'

interface BoardViewProps {
    board: Board
    columns: ColumnWithCards[]
    availableTags: CardTagOption[]
    priorityCardsCount: number
    hasPriorityTag: boolean
}

/**
 * `useViewMode` usa `useSearchParams`, que o Next.js exige estar
 * dentro de uma Suspense boundary (senão a rota inteira perde
 * prerendering estático). O board em si é sempre dinâmico (dados do
 * usuário logado), mas mantemos o boundary para seguir a exigência e
 * não gerar warning de build.
 */
export function BoardView(props: BoardViewProps) {
    return (
        <Suspense fallback={<BoardViewSkeleton columns={props.columns} />}>
            <BoardViewInner {...props} />
        </Suspense>
    )
}

function BoardViewSkeleton({ columns }: { columns: ColumnWithCards[] }) {
    return (
        <div className="flex h-full min-w-0 flex-col bg-slate-50">
            <div className="flex h-full min-w-max items-start gap-3 p-6 pt-5">
                {columns.map((column) => (
                    <div
                        key={column.id}
                        className="h-112.5 w-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                    />
                ))}
            </div>
        </div>
    )
}

function BoardViewInner({
    columns: initialColumns,
    availableTags,
    priorityCardsCount,
    hasPriorityTag,
}: BoardViewProps) {
    /**
     * Impede o DndContext de ser renderizado no servidor.
     *
     * O @dnd-kit gera IDs internos como:
     * DndDescribedBy-0
     *
     * Esses IDs podem ser diferentes entre servidor e cliente,
     * causando Hydration Mismatch.
     */
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const {
        columns,
        handleDragEnd,
        handleDragStart,
        handleDragOver,
    } = useBoardDnd(initialColumns)

    const [search, setSearch] = useState('')
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

    const { view, setView, isMobile } = useViewMode()

    const allColumns = useMemo(
        () => columns.map((c) => ({ id: c.id, title: c.title, type: c.type })),
        [columns]
    )

    const selectedCard = useMemo(() => {
        if (!selectedCardId) return null

        for (const column of columns) {
            const found = column.cards.find((c) => c.id === selectedCardId)
            if (found) return found
        }

        return null
    }, [columns, selectedCardId])

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

    // Usado pelas views de Lista e Calendário — funcionam sobre os
    // mesmos dados (já filtrados pela busca), só mudam a forma de
    // apresentar. Nenhum dado novo é buscado no servidor.
    const flattenedCards = useMemo(
        () =>
            filteredColumns.flatMap((column) =>
                column.cards.map((card) => ({
                    ...card,
                    columnTitle: column.title,
                }))
            ),
        [filteredColumns]
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
            <div className="shrink-0 px-4 pt-5 sm:px-6">

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
                                &ldquo;Disciplina hoje, resultados amanhã.&rdquo;
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
                                {hasPriorityTag ? priorityCardsCount : '—'}
                            </p>

                            {!hasPriorityTag && (
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    Crie a tag &ldquo;Prioridade máxima&rdquo;
                                </p>
                            )}
                        </div>

                    </div>

                </div>

                {/* TOOLBAR */}
                <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">

                    <ViewSwitcher view={view} onChange={setView} isMobile={isMobile} />

                    <div className="flex flex-wrap gap-3">

                        {/* BUSCA — funciona nas 3 views, sobre os mesmos dados já carregados */}
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Buscar tarefa..."
                            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                        />

                    </div>

                </div>

            </div>

            {/* CONTEÚDO */}
            <main
                className={
                    view === 'board'
                        ? 'min-h-0 flex-1 overflow-x-auto overflow-y-hidden'
                        : 'min-h-0 flex-1 overflow-hidden'
                }
            >

                {view === 'board' && (

                    mounted ? (

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
                                                allColumns={allColumns}
                                                availableTags={availableTags}
                                                onOpenCard={setSelectedCardId}
                                            />

                                        )
                                    )}

                                    <CreateColumnButton />

                                </div>

                            </SortableContext>

                        </DndContext>

                    ) : (

                        /*
                         * Placeholder enquanto o componente
                         * ainda não foi montado no navegador.
                         *
                         * Isso evita o hydration mismatch.
                         */
                        <div className="flex h-full min-w-max items-start gap-3 p-6 pt-5">

                            {initialColumns.map(
                                (column) => (
                                    <div
                                        key={
                                            column.id
                                        }
                                        className="h-112.5 w-72 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                                    />
                                )
                            )}

                        </div>

                    )

                )}

                {view === 'list' && (
                    <BoardList
                        cards={flattenedCards}
                        allColumns={allColumns}
                        availableTags={availableTags}
                        onOpenCard={setSelectedCardId}
                    />
                )}

                {view === 'calendar' && (
                    <BoardCalendar
                        cards={flattenedCards}
                        onOpenCard={setSelectedCardId}
                    />
                )}

            </main>

            <CardDetailsPanel
                card={selectedCard}
                open={selectedCard !== null}
                onOpenChange={(open) => {
                    if (!open) setSelectedCardId(null)
                }}
                columns={allColumns}
                availableTags={availableTags}
            />

        </div>
    )
}
