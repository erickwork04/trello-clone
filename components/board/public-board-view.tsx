'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { KanbanSquare, ListChecks } from 'lucide-react'
import { PublicCardDetailsDialog } from './public-card-details-dialog'

export type PublicBoardCard = {
    id: string
    name: string
    description: string | null
    dueDate: string | null
    createdAt: string
    checklistItems: Array<{ id: string; title: string; completed: boolean }>
}

export type PublicBoardColumn = {
    id: string
    title: string
    color: string
    type: 'DEFAULT' | 'PENDING' | 'IN_PROGRESS' | 'DONE'
    cards: PublicBoardCard[]
}

const columnColor: Record<string, string> = {
    slate: 'var(--column-slate)',
    blue: 'var(--column-blue)',
    green: 'var(--column-green)',
    amber: 'var(--column-amber)',
    red: 'var(--column-red)',
    purple: 'var(--column-purple)',
    pink: 'var(--column-pink)',
    cyan: 'var(--column-cyan)',
}

function shortDate(value: string) {
    return dayjs(value).locale('pt-br').format('D MMM YYYY')
}

export function PublicBoardView({
    board,
    columns,
    token,
}: {
    board: { id: string; title: string; description: string | null }
    columns: PublicBoardColumn[]
    token: string
}) {
    const [selectedCard, setSelectedCard] = useState<{
        card: PublicBoardCard
        column: PublicBoardColumn
    } | null>(null)
    const allCards = useMemo(() => columns.flatMap((column) => column.cards), [columns])
    const completedCount = columns.reduce(
        (count, column) => count + (column.type === 'DONE' ? column.cards.length : 0),
        0
    )
    const progress = allCards.length ? Math.round((completedCount / allCards.length) * 100) : 0

    return (
        <main className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b border-border bg-card px-4 py-5 sm:px-6">
                <div className="mx-auto flex max-w-screen-2xl flex-wrap items-start justify-between gap-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <KanbanSquare className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">Kanban compartilhado · somente leitura</p>
                            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">{board.title}</h1>
                            {board.description && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{board.description}</p>}
                        </div>
                    </div>
                    <div className="w-full max-w-sm rounded-xl border border-border bg-background p-4 sm:w-72">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="font-medium">Progresso</span>
                            <span className="text-muted-foreground">{completedCount}/{allCards.length} cards · {progress}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>
            </header>

            <section className="min-h-0 flex-1 px-4 py-5 sm:px-6">
                <div className="mx-auto mb-4 flex max-w-screen-2xl items-center gap-2 text-sm text-muted-foreground">
                    <ListChecks className="size-4" />
                    {allCards.length} {allCards.length === 1 ? 'card' : 'cards'} em {columns.length} {columns.length === 1 ? 'coluna' : 'colunas'}
                </div>
                <div className="mx-auto flex max-w-screen-2xl items-start gap-4 overflow-x-auto pb-5">
                    {columns.map((column) => (
                        <section
                            key={column.id}
                            aria-label={`Coluna ${column.title}`}
                            className="flex max-h-[calc(100vh-13rem)] min-h-72 w-[min(84vw,21rem)] shrink-0 flex-col rounded-xl border border-border bg-muted/60"
                        >
                            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: columnColor[column.color] ?? 'var(--column-slate)' }} />
                                    <h2 className="truncate text-sm font-semibold">{column.title}</h2>
                                </div>
                                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{column.cards.length}</span>
                            </header>
                            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                                {column.cards.map((item) => {
                                    const done = item.checklistItems.filter((check) => check.completed).length
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedCard({ card: item, column })}
                                            className="block w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            aria-label={`Abrir card ${item.name}, coluna ${column.title}`}
                                        >
                                            <span className="block font-medium leading-5">{item.name}</span>
                                            {item.description && <span className="mt-2 line-clamp-3 block whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{item.description}</span>}
                                            <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                {item.dueDate && <span>Prazo: {shortDate(item.dueDate)}</span>}
                                                {item.checklistItems.length > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" />{done}/{item.checklistItems.length}</span>}
                                            </span>
                                        </button>
                                    )
                                })}
                                {column.cards.length === 0 && <p className="px-2 py-5 text-center text-sm text-muted-foreground">Nenhum card nesta coluna.</p>}
                            </div>
                        </section>
                    ))}
                </div>
            </section>
            <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
                Link público com acesso somente de leitura ao Kanban. Observações podem ser adicionadas nos cards.
            </footer>
            {selectedCard && <PublicCardDetailsDialog
                key={selectedCard.card.id}
                card={selectedCard.card}
                column={selectedCard.column}
                token={token}
                onClose={() => setSelectedCard(null)}
            />}
        </main>
    )
}
