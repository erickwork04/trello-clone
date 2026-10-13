'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Link2, LoaderCircle, Share2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    activateProjectShare,
    getProjectShare,
    revokeProjectShare,
} from '@/app/(app)/board/work-actions'

export function ProjectShareDialog({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(false)
    const [path, setPath] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()
    const link = path && typeof window !== 'undefined' ? `${window.location.origin}${path}` : ''

    function loadShare() {
        setOpen(true)
        setActive(false)
        setPath(null)
        startTransition(async () => {
            const result = await getProjectShare({ projectId })
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            setActive(result?.data?.isActive ?? false)
            setPath(result?.data?.path ?? null)
        })
    }

    function enableShare() {
        startTransition(async () => {
            const result = await activateProjectShare({ projectId })
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            setActive(true)
            setPath(result?.data?.path ?? null)
            toast.success('Link público ativado.')
        })
    }

    function disableShare() {
        startTransition(async () => {
            const result = await revokeProjectShare({ projectId })
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            setActive(false)
            setPath(null)
            toast.success('Acesso público revogado.')
        })
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(link)
            toast.success('Link copiado.')
        } catch {
            toast.error('Não foi possível copiar o link. Tente selecioná-lo e copiá-lo manualmente.')
        }
    }

    return <>
        <button
            onClick={loadShare}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/25 px-3 py-2 text-sm font-medium text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Share2 className="size-4" /> Compartilhar
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Compartilhar projeto</DialogTitle>
                    <DialogDescription>
                        Qualquer pessoa com o link poderá visualizar os dados selecionados deste projeto, sem entrar na conta.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-xl border border-border bg-muted p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {pending ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : active ? <Check className="size-4 text-[var(--column-green)]" /> : <Link2 className="size-4 text-muted-foreground" />}
                        Compartilhamento {pending ? 'carregando' : active ? 'ativo' : 'desativado'}
                    </div>
                    {active && path && <div className="mt-3 flex gap-2">
                        <input readOnly value={link} aria-label="Link público do projeto" className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-muted-foreground" />
                        <button onClick={copyLink} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Copy className="size-4" /><span className="hidden sm:inline">Copiar</span></button>
                    </div>}
                    {!active && <p className="mt-2 text-sm leading-6 text-muted-foreground">O link permanece desativado até você ativar o compartilhamento. Você pode revogar o acesso a qualquer momento.</p>}
                </div>
                <DialogFooter>
                    {active ? <button disabled={pending} onClick={disableShare} className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-50">Revogar acesso</button> : <button disabled={pending} onClick={enableShare} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">Gerar link público</button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
}
