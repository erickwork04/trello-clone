'use client'

import { useEffect, useRef, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Loader2, Plus, Trash2, Check } from 'lucide-react'

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

import {
    updateCard,
    moveCard,
    toggleCardTag,
    updateCardDetails,
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
} from '@/app/(app)/board/actions'

import { BoardCard, CardTagOption } from './use-board-dnd'

/**
 * Move um card para o fim da coluna de destino. `moveCard` já faz o
 * clamp internamente (Math.min(targetPosition, targetCards.length)),
 * então basta enviar um número maior que qualquer coluna real pode
 * ter para cair sempre no final — sem precisar saber a contagem exata
 * de cards da coluna de destino aqui no client.
 */
const APPEND_TO_END = 1_000_000

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function useSaveStatus() {
    const [status, setStatus] = useState<SaveStatus>('idle')
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function markSaving() {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setStatus('saving')
    }

    function markSaved() {
        setStatus('saved')
        timeoutRef.current = setTimeout(() => setStatus('idle'), 1500)
    }

    function markError() {
        setStatus('error')
        timeoutRef.current = setTimeout(() => setStatus('idle'), 2500)
    }

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    return { status, markSaving, markSaved, markError }
}

function SaveIndicator({ status }: { status: SaveStatus }) {
    if (status === 'idle') return null

    if (status === 'saving') {
        return (
            <span className="flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="size-3 animate-spin" />
                Salvando...
            </span>
        )
    }

    if (status === 'saved') {
        return <span className="text-xs text-emerald-600">Salvo</span>
    }

    return <span className="text-xs text-red-600">Erro ao salvar</span>
}

interface CardDetailsPanelProps {
    card: BoardCard | null
    open: boolean
    onOpenChange: (open: boolean) => void
    columns: Array<{ id: string; title: string }>
    availableTags: CardTagOption[]
}

export function CardDetailsPanel({
    card,
    open,
    onOpenChange,
    columns,
    availableTags,
}: CardDetailsPanelProps) {
    if (!card) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent />
            </Sheet>
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent key={card.id}>
                <SheetHeader className="shrink-0">
                    <TitleField card={card} />
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    <StatusField card={card} columns={columns} />
                    <TagsField card={card} availableTags={availableTags} />
                    <DueDateField card={card} />
                    <DescriptionField card={card} />
                    <ChecklistField card={card} />
                </div>
            </SheetContent>
        </Sheet>
    )
}

function FieldRow({
    label,
    status,
    children,
}: {
    label: string
    status?: SaveStatus
    children: React.ReactNode
}) {
    return (
        <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                </p>
                {status && <SaveIndicator status={status} />}
            </div>
            {children}
        </div>
    )
}

function TitleField({ card }: { card: BoardCard }) {
    const [value, setValue] = useState(card.name)
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute } = useAction(updateCard, {
        onSuccess: markSaved,
        onError: () => {
            setValue(card.name)
            markError()
        },
    })

    function handleBlur() {
        const trimmed = value.trim()
        if (!trimmed || trimmed === card.name) {
            setValue(card.name)
            return
        }
        markSaving()
        execute({ id: card.id, name: trimmed })
    }

    return (
        <div className="flex items-center justify-between gap-2">
            <SheetTitle asChild>
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                    className="w-full border-none bg-transparent p-0 text-base font-semibold text-slate-900 outline-none"
                    aria-label="Título do card"
                />
            </SheetTitle>
            <SaveIndicator status={status} />
        </div>
    )
}

function StatusField({
    card,
    columns,
}: {
    card: BoardCard
    columns: Array<{ id: string; title: string }>
}) {
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute } = useAction(moveCard, {
        onSuccess: markSaved,
        onError: markError,
    })

    function handleChange(targetColumnId: string) {
        if (targetColumnId === card.columnId) return
        markSaving()
        execute({
            cardId: card.id,
            targetColumnId,
            targetPosition: APPEND_TO_END,
        })
    }

    return (
        <FieldRow label="Status" status={status}>
            <select
                value={card.columnId}
                onChange={(e) => handleChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            >
                {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                        {column.title}
                    </option>
                ))}
            </select>
        </FieldRow>
    )
}

function TagsField({
    card,
    availableTags,
}: {
    card: BoardCard
    availableTags: CardTagOption[]
}) {
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute } = useAction(toggleCardTag, {
        onSuccess: markSaved,
        onError: markError,
    })

    const attachedIds = new Set(card.tags.map((t) => t.id))

    function handleToggle(tagId: string) {
        markSaving()
        execute({
            cardId: card.id,
            tagId,
            attach: !attachedIds.has(tagId),
        })
    }

    return (
        <FieldRow label="Tags" status={status}>
            {availableTags.length === 0 ? (
                <p className="text-sm text-slate-400">
                    Você ainda não criou tags.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {availableTags.map((t) => {
                        const active = attachedIds.has(t.id)
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => handleToggle(t.id)}
                                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                                    active
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: t.color }}
                                />
                                {t.name}
                            </button>
                        )
                    })}
                </div>
            )}
        </FieldRow>
    )
}

function DueDateField({ card }: { card: BoardCard }) {
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute } = useAction(updateCardDetails, {
        onSuccess: markSaved,
        onError: markError,
    })

    const initialValue = card.dueDate
        ? new Date(card.dueDate).toISOString().slice(0, 10)
        : ''

    function handleChange(value: string) {
        markSaving()
        execute({ cardId: card.id, dueDate: value || null })
    }

    return (
        <FieldRow label="Prazo" status={status}>
            <input
                type="date"
                defaultValue={initialValue}
                onChange={(e) => handleChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
            />
        </FieldRow>
    )
}

function DescriptionField({ card }: { card: BoardCard }) {
    const [value, setValue] = useState(card.description ?? '')
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute } = useAction(updateCardDetails, {
        onSuccess: markSaved,
        onError: markError,
    })

    function save() {
        if (value === (card.description ?? '')) return
        markSaving()
        execute({ cardId: card.id, description: value || null })
    }

    return (
        <FieldRow label="Descrição" status={status}>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.currentTarget.blur()
                    }
                }}
                placeholder="Adicione detalhes..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-base outline-none sm:text-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
        </FieldRow>
    )
}

function ChecklistField({ card }: { card: BoardCard }) {
    const [newItemTitle, setNewItemTitle] = useState('')
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute: execToggle } = useAction(toggleChecklistItem, {
        onSuccess: markSaved,
        onError: markError,
    })

    const { execute: execDelete } = useAction(deleteChecklistItem, {
        onSuccess: markSaved,
        onError: markError,
    })

    const { execute: execCreate, isExecuting: isCreating } = useAction(
        createChecklistItem,
        {
            onSuccess: () => {
                markSaved()
                setNewItemTitle('')
            },
            onError: markError,
        }
    )

    const items = [...card.checklistItems].sort(
        (a, b) => a.position - b.position
    )

    const completedCount = items.filter((i) => i.completed).length

    function handleAdd() {
        const trimmed = newItemTitle.trim()
        if (!trimmed) return
        markSaving()
        execCreate({ cardId: card.id, title: trimmed })
    }

    return (
        <FieldRow
            label={`Checklist ${
                items.length > 0 ? `(${completedCount}/${items.length})` : ''
            }`}
            status={status}
        >
            <div className="space-y-1.5">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-slate-50"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                markSaving()
                                execToggle({
                                    id: item.id,
                                    completed: !item.completed,
                                })
                            }}
                            className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                                item.completed
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-300 bg-white'
                            }`}
                            aria-label={
                                item.completed
                                    ? 'Desmarcar item'
                                    : 'Marcar item'
                            }
                        >
                            {item.completed && <Check className="size-3" />}
                        </button>

                        <span
                            className={`flex-1 text-sm ${
                                item.completed
                                    ? 'text-slate-400 line-through'
                                    : 'text-slate-700'
                            }`}
                        >
                            {item.title}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                markSaving()
                                execDelete({ id: item.id })
                            }}
                            className="opacity-0 transition group-hover:opacity-100"
                            aria-label="Remover item"
                        >
                            <Trash2 className="size-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
                <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAdd()
                        }
                    }}
                    placeholder="Novo item..."
                    disabled={isCreating}
                    className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-base sm:h-9 sm:text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isCreating || !newItemTitle.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                    aria-label="Adicionar item"
                >
                    <Plus className="size-4" />
                </button>
            </div>
        </FieldRow>
    )
}
