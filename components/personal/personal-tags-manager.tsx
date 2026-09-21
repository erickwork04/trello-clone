'use client'

import { useState, useTransition } from 'react'
import { Loader2, Plus, Tag as TagIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { createTag } from '@/app/(app)/tags/actions'
import { TagActions } from '@/components/dashboard/tag-actions'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const COLORS = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#d97706',
    '#7c3aed',
    '#db2777',
    '#ea580c',
    '#64748b',
]

interface TagWithUsage {
    id: string
    name: string
    color: string
    /**
     * Uso em TODAS as tarefas do usuário (a tag é global — não há
     * como contar "só uso em Pessoal" sem um campo de escopo). O
     * texto deixa isso claro pra não sugerir uma contagem que o
     * modelo não sustenta.
     */
    usageCount: number
}

interface PersonalTagsManagerProps {
    tags: TagWithUsage[]
}

export function PersonalTagsManager({ tags }: PersonalTagsManagerProps) {
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleCreate() {
        const trimmed = name.trim()
        if (!trimmed) return

        startTransition(async () => {
            const result = await createTag({ name: trimmed, color })

            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }

            setName('')
            setColor(COLORS[0])
            setCreating(false)
            router.refresh()
        })
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="flex h-11 items-center gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    <TagIcon className="size-4" />
                    Tags
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="max-h-[70vh] w-80 overflow-y-auto space-y-3 p-4"
            >
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Suas tags
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                        As tags são globais — valem em qualquer área do app,
                        não só em Pessoal.
                    </p>
                </div>

                {tags.length === 0 ? (
                    <p className="py-2 text-sm text-slate-400">
                        Você ainda não tem tags.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {tags.map((t) => (
                            <div
                                key={t.id}
                                className="rounded-xl border border-slate-100 p-2.5"
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <span
                                        className="size-3 shrink-0 rounded-full"
                                        style={{ backgroundColor: t.color }}
                                    />
                                    <span className="flex-1 truncate text-sm font-medium text-slate-800">
                                        {t.name}
                                    </span>
                                    <span className="shrink-0 text-[11px] text-slate-400">
                                        {t.usageCount === 0
                                            ? 'sem uso'
                                            : `usada em ${t.usageCount} tarefa${
                                                t.usageCount > 1 ? 's' : ''
                                            }`}
                                    </span>
                                </div>

                                <TagActions
                                    tagId={t.id}
                                    name={t.name}
                                    color={t.color}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-slate-100 pt-3">
                    {!creating ? (
                        <button
                            type="button"
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="size-4" />
                            Nova tag
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome da tag"
                                autoFocus
                                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setColor(item)}
                                        className={`size-7 rounded-full border-2 transition ${
                                            color === item
                                                ? 'border-slate-900'
                                                : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: item }}
                                        aria-label={`Selecionar cor ${item}`}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreating(false)
                                        setName('')
                                    }}
                                    disabled={isPending}
                                    className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={isPending || !name.trim()}
                                    className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending && (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    )}
                                    Criar tag
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
