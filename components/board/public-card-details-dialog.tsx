'use client'

import { useEffect, useState, type FormEvent } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { CalendarDays, CheckCircle2, Circle, LoaderCircle, Send } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import type { PublicBoardCard, PublicBoardColumn } from './public-board-view'

type Observation = {
    id: string
    visitorName: string | null
    content: string
    createdAt: string
}

function displayDate(value: string) {
    return dayjs(value).locale('pt-br').format('D [de] MMMM [de] YYYY [às] HH:mm')
}

export function PublicCardDetailsDialog({
    card,
    column,
    token,
    onClose,
}: {
    card: PublicBoardCard
    column: PublicBoardColumn
    token: string
    onClose: () => void
}) {
    const [tab, setTab] = useState<'details' | 'observations'>('details')
    const [observations, setObservations] = useState<Observation[]>([])
    const [visitorName, setVisitorName] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
    const endpoint = `/api/public/board-share/${encodeURIComponent(token)}/cards/${encodeURIComponent(card.id)}/observations`
    const completed = card.checklistItems.filter((item) => item.completed).length

    useEffect(() => {
        const controller = new AbortController()
        fetch(endpoint, { cache: 'no-store', signal: controller.signal })
            .then(async (response) => {
                const result = await response.json()
                if (!response.ok) throw new Error(result.message ?? 'Não foi possível carregar as observações.')
                setObservations(result.observations)
            })
            .catch((error: unknown) => {
                if (error instanceof Error && error.name === 'AbortError') return
                setFeedback({
                    kind: 'error',
                    text: error instanceof Error ? error.message : 'Não foi possível carregar as observações.',
                })
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [endpoint])

    async function submitObservation(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFeedback(null)
        const trimmedContent = content.trim()
        if (!trimmedContent) {
            setFeedback({ kind: 'error', text: 'Escreva uma observação antes de enviar.' })
            return
        }

        setSending(true)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: trimmedContent,
                    visitorName: visitorName.trim() || undefined,
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message ?? 'Não foi possível enviar a observação.')
            setObservations((current) => [result.observation, ...current])
            setContent('')
            setFeedback({ kind: 'success', text: 'Observação enviada.' })
        } catch (error) {
            setFeedback({
                kind: 'error',
                text: error instanceof Error ? error.message : 'Não foi possível enviar a observação. Tente novamente.',
            })
        } finally {
            setSending(false)
        }
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{card.name}</DialogTitle>
                    <DialogDescription>
                        Consulta do card na coluna {column.title}. Os dados do Kanban não podem ser alterados neste link.
                    </DialogDescription>
                </DialogHeader>
                <div role="tablist" aria-label="Detalhes do card" className="flex gap-1 border-b border-border">
                    <button type="button" role="tab" aria-selected={tab === 'details'} onClick={() => setTab('details')} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        Detalhes
                    </button>
                    <button type="button" role="tab" aria-selected={tab === 'observations'} onClick={() => setTab('observations')} className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === 'observations' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        Observações <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">{observations.length}</span>
                    </button>
                </div>

                {tab === 'details' ? <section role="tabpanel" className="space-y-5 py-2">
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-accent px-3 py-1 font-medium text-accent-foreground">{column.title}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-muted-foreground"><CalendarDays className="size-3.5" />Prazo: {card.dueDate ? dayjs(card.dueDate).locale('pt-br').format('D [de] MMMM [de] YYYY') : 'Sem prazo'}</span>
                    </div>
                    {card.description && <div>
                        <h3 className="text-sm font-semibold">Descrição</h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{card.description}</p>
                    </div>}
                    <dl className="grid gap-3 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
                        <div><dt className="text-muted-foreground">Criado em</dt><dd className="mt-1 font-medium">{displayDate(card.createdAt)}</dd></div>
                        <div><dt className="text-muted-foreground">Status atual</dt><dd className="mt-1 font-medium">{column.title}</dd></div>
                    </dl>
                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold">Checklist</h3>
                            <span className="text-xs text-muted-foreground">{completed} de {card.checklistItems.length} concluídos</span>
                        </div>
                        {card.checklistItems.length ? <ul className="mt-2 divide-y divide-border rounded-xl border border-border px-3">
                            {card.checklistItems.map((item) => <li key={item.id} className="flex items-start gap-2.5 py-2.5 text-sm">
                                {item.completed ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--column-green)]" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />}
                                <span className={item.completed ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
                            </li>)}
                        </ul> : <p className="mt-2 text-sm text-muted-foreground">Este card não tem itens de checklist.</p>}
                    </div>
                </section> : <section role="tabpanel" className="space-y-5 py-2">
                    <form onSubmit={submitObservation} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                        <label className="block text-sm font-medium">
                            Seu nome <span className="font-normal text-muted-foreground">(opcional)</span>
                            <input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} maxLength={80} autoComplete="name" className="mt-1.5 min-h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Como devemos identificar você?" />
                            <span className="mt-1 block text-xs text-muted-foreground">Nome informado pelo visitante; não é uma identidade verificada.</span>
                        </label>
                        <label className="block text-sm font-medium">
                            Observação
                            <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={4} required className="mt-1.5 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Escreva uma observação sobre este card..." />
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">{content.length}/2000</span>
                            <button type="submit" disabled={sending || !content.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                                {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                                {sending ? 'Enviando…' : 'Enviar observação'}
                            </button>
                        </div>
                        {feedback && <p role={feedback.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${feedback.kind === 'error' ? 'text-destructive' : 'text-[var(--column-green)]'}`}>{feedback.text}</p>}
                    </form>

                    <div aria-live="polite">
                        <h3 className="text-sm font-semibold">Observações deste card</h3>
                        {loading ? <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Carregando observações…</p> : observations.length ? <ul className="mt-3 space-y-3">
                            {observations.map((item) => <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                    <p className="text-sm font-semibold">Visitante{item.visitorName ? ` · nome informado: ${item.visitorName}` : ''}</p>
                                    <time dateTime={item.createdAt} className="text-xs text-muted-foreground">{displayDate(item.createdAt)}</time>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{item.content}</p>
                            </li>)}
                        </ul> : <p className="mt-3 text-sm text-muted-foreground">Ainda não há observações. Você pode adicionar a primeira acima.</p>}
                    </div>
                </section>}
            </DialogContent>
        </Dialog>
    )
}
