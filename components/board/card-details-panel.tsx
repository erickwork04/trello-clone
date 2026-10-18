'use client'

import { useEffect, useRef, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { Loader2, Plus, Trash2, Check, MessageSquareText, RefreshCw } from 'lucide-react'

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
    getCardObservations,
    updateVisitorObservation,
    deleteVisitorObservation,
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
            <SheetContent key={card.id} className="sm:inset-y-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[min(88dvh,900px)] sm:w-[min(92vw,760px)] sm:max-w-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border sm:border-slate-200">
                <SheetHeader className="shrink-0">
                    <TitleField card={card} />
                    {card.requirementTitle && (
                        <p className="text-xs text-blue-700">
                            Originado do requisito: {card.requirementTitle}
                        </p>
                    )}
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    <StatusField card={card} columns={columns} />
                    <TagsField card={card} availableTags={availableTags} />
                    <DueDateField card={card} />
                    <DescriptionField card={card} />
                    <ChecklistField card={card} />
                    <VisitorObservationsField cardId={card.id} />
                </div>
            </SheetContent>
        </Sheet>
    )
}

type VisitorObservation = {
    id: string
    visitorName: string | null
    content: string
    createdAt: string
}

function VisitorObservationsField({ cardId }: { cardId: string }) {
    const [observations, setObservations] = useState<VisitorObservation[]>([])
    const [loadError, setLoadError] = useState(false)
    const [mutationFeedback, setMutationFeedback] = useState('')
    const { execute, isExecuting } = useAction(getCardObservations, {
        onExecute: () => setLoadError(false),
        onSuccess: ({ data }) => setObservations(data),
        onError: () => setLoadError(true),
    })

    useEffect(() => {
        execute({ cardId })
    }, [cardId, execute])

    return (
        <section className="mb-6 border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MessageSquareText className="size-4" /> Observações do visitante
                </h3>
                <button
                    type="button"
                    onClick={() => execute({ cardId })}
                    disabled={isExecuting}
                    aria-label="Atualizar observações"
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                >
                    <RefreshCw className={`size-4 ${isExecuting ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {isExecuting ? (
                <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
                    <Loader2 className="size-4 animate-spin" /> Carregando observações...
                </p>
            ) : loadError ? (
                <p className="text-sm text-destructive" role="alert">
                    Não foi possível carregar as observações. Tente atualizar.
                </p>
            ) : observations.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Ainda não há observações de visitantes neste card.
                </p>
            ) : (
                <>
                {mutationFeedback && <p role="status" className="mb-2 text-xs text-emerald-700">{mutationFeedback}</p>}
                <ul className="space-y-3">
                    {observations.map((observation) => (
                        <OwnerObservationItem
                            key={observation.id}
                            observation={observation}
                            onUpdate={(content) => { setObservations((current) => current.map((item) => item.id === observation.id ? { ...item, content } : item)); setMutationFeedback('Observação atualizada.') }}
                            onDelete={() => { setObservations((current) => current.filter((item) => item.id !== observation.id)); setMutationFeedback('Observação excluída.') }}
                        />
                    ))}
                </ul>
                </>
            )}
        </section>
    )
}

function OwnerObservationItem({
    observation,
    onUpdate,
    onDelete,
}: {
    observation: VisitorObservation
    onUpdate: (content: string) => void
    onDelete: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [content, setContent] = useState(observation.content)
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
    const { execute: save, isExecuting: isSaving } = useAction(updateVisitorObservation, {
        onSuccess: ({ data }) => { onUpdate(data.content); setEditing(false); setFeedback({ kind: 'success', text: 'Observação atualizada.' }) },
        onError: () => setFeedback({ kind: 'error', text: 'Não foi possível salvar a observação.' }),
    })
    const { execute: remove, isExecuting: isDeleting } = useAction(deleteVisitorObservation, {
        onSuccess: () => { onDelete(); setFeedback({ kind: 'success', text: 'Observação excluída.' }) },
        onError: () => setFeedback({ kind: 'error', text: 'Não foi possível excluir a observação.' }),
    })

    return (
        <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-medium text-slate-800">
                    Visitante{observation.visitorName ? ` · nome informado: ${observation.visitorName}` : ''}
                </p>
                <time dateTime={observation.createdAt} className="text-xs text-slate-500">
                    {dayjs(observation.createdAt).locale('pt-br').format('D [de] MMM [de] YYYY, HH:mm')}
                </time>
            </div>
            {editing ? (
                <div className="mt-2 space-y-2">
                    <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Editar observação" />
                    <div className="flex gap-2">
                        <button type="button" disabled={isSaving || !content.trim()} onClick={() => save({ id: observation.id, content })} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Salvar</button>
                        <button type="button" disabled={isSaving} onClick={() => { setContent(observation.content); setEditing(false); setFeedback(null) }} className="rounded-md px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                    </div>
                </div>
            ) : <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{observation.content}</p>}
            <div className="mt-2 flex items-center justify-end gap-1">
                {!editing && <button type="button" onClick={() => { setContent(observation.content); setEditing(true) }} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white hover:text-slate-800">Editar</button>}
                <button type="button" disabled={isDeleting} onClick={() => { if (window.confirm('Excluir esta observação?')) remove({ id: observation.id }) }} aria-label="Excluir observação" className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-50"><Trash2 className="size-4" /></button>
            </div>
            {feedback && <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={`mt-1 text-xs ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{feedback.text}</p>}
        </li>
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
    const [items, setItems] = useState(card.checklistItems)
    const [newItemTitle, setNewItemTitle] = useState('')
    const { status, markSaving, markSaved, markError } = useSaveStatus()

    const { execute: execToggle } = useAction(toggleChecklistItem, {
        onSuccess: ({ data }) => {
            setItems((current) => current.map((item) => item.id === data.id ? { ...item, completed: data.completed } : item))
            markSaved()
        },
        onError: markError,
    })

    const { execute: execDelete } = useAction(deleteChecklistItem, {
        onSuccess: ({ data }) => {
            setItems((current) => current.filter((item) => item.id !== data.id))
            markSaved()
        },
        onError: markError,
    })

    const { execute: execCreate, isExecuting: isCreating } = useAction(
        createChecklistItem,
        {
            onSuccess: ({ data }) => {
                setItems((current) => [...current, data])
                markSaved()
                setNewItemTitle('')
            },
            onError: markError,
        }
    )

    const sortedItems = [...items].sort(
        (a, b) => a.position - b.position
    )

    const completedCount = sortedItems.filter((i) => i.completed).length

    function handleAdd() {
        const trimmed = newItemTitle.trim()
        if (!trimmed) return
        markSaving()
        execCreate({ cardId: card.id, title: trimmed })
    }

    return (
        <FieldRow
            label={`Checklist ${
                sortedItems.length > 0 ? `(${completedCount}/${sortedItems.length})` : ''
            }`}
            status={status}
        >
            <div className="space-y-1.5">
                {sortedItems.map((item) => (
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
                            className="rounded p-1 text-slate-400 transition hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:opacity-0 sm:group-hover:opacity-100"
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
