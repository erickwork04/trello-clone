'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import {
    ArrowRightLeft,
    CheckCircle2,
    MoreVertical,
    Pencil,
    Tag as TagIcon,
    Trash2,
} from 'lucide-react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { deleteCard, moveCard, toggleCardTag } from '@/app/(app)/board/actions'
import { BoardCard, CardTagOption } from './use-board-dnd'

const APPEND_TO_END = 1_000_000

interface CardMenuProps {
    card: BoardCard
    columns: Array<{ id: string; title: string; type: string }>
    availableTags: CardTagOption[]
    onOpenDetails: () => void
    onEdit: () => void
    /**
     * Por padrão o botão só aparece no hover do card (`group-hover`),
     * pensado pro Kanban desktop. Em listas (sem "group" ancestral e
     * sem hover útil no touch), passar `true` pra ficar sempre visível.
     */
    alwaysVisible?: boolean
}

export function CardMenu({
    card,
    columns,
    availableTags,
    onOpenDetails,
    onEdit,
    alwaysVisible = false,
}: CardMenuProps) {
    const [open, setOpen] = useState(false)
    const [submenu, setSubmenu] = useState<'root' | 'move' | 'tags'>('root')
    const [deleteOpen, setDeleteOpen] = useState(false)

    const { execute: execMove } = useAction(moveCard, {
        onError: () => toast.error('Erro ao mover card.'),
    })

    const { execute: execToggleTag } = useAction(toggleCardTag, {
        onError: () => toast.error('Erro ao atualizar tag.'),
    })

    const { execute: execDelete } = useAction(deleteCard, {
        onSuccess: () => toast.success('Card removido.'),
        onError: () => toast.error('Erro ao deletar card.'),
    })

    const doneColumn = columns.find((c) => c.type === 'DONE')
    const attachedIds = new Set(card.tags.map((t) => t.id))

    function close() {
        setOpen(false)
        setSubmenu('root')
    }

    return (
        <>
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next)
                    if (!next) setSubmenu('root')
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 shrink-0 text-[color:var(--muted-foreground)] transition-opacity ${
                            alwaysVisible
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100'
                        }`}
                        aria-label="Ações do card"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreVertical size={13} />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    className="w-56 p-1"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {submenu === 'root' && (
                        <div className="flex flex-col">
                            <MenuButton
                                icon={<Pencil size={14} />}
                                label="Abrir detalhes"
                                onClick={() => {
                                    onOpenDetails()
                                    close()
                                }}
                            />
                            <MenuButton
                                icon={<Pencil size={14} />}
                                label="Editar título"
                                onClick={() => {
                                    onEdit()
                                    close()
                                }}
                            />
                            <MenuButton
                                icon={<ArrowRightLeft size={14} />}
                                label="Mover para..."
                                onClick={() => setSubmenu('move')}
                            />
                            <MenuButton
                                icon={<TagIcon size={14} />}
                                label="Tags"
                                onClick={() => setSubmenu('tags')}
                            />
                            {doneColumn && doneColumn.id !== card.columnId && (
                                <MenuButton
                                    icon={<CheckCircle2 size={14} />}
                                    label="Concluir"
                                    onClick={() => {
                                        execMove({
                                            cardId: card.id,
                                            targetColumnId: doneColumn.id,
                                            targetPosition: APPEND_TO_END,
                                        })
                                        close()
                                    }}
                                />
                            )}
                            <div className="my-1 h-px bg-slate-100" />
                            <MenuButton
                                icon={<Trash2 size={14} />}
                                label="Excluir"
                                danger
                                onClick={() => {
                                    setDeleteOpen(true)
                                    setOpen(false)
                                }}
                            />
                        </div>
                    )}

                    {submenu === 'move' && (
                        <div className="flex flex-col">
                            <button
                                type="button"
                                onClick={() => setSubmenu('root')}
                                className="mb-1 px-2 py-1 text-left text-xs text-slate-400 hover:text-slate-600"
                            >
                                ← Voltar
                            </button>
                            {columns.map((column) => (
                                <MenuButton
                                    key={column.id}
                                    label={column.title}
                                    active={column.id === card.columnId}
                                    onClick={() => {
                                        if (column.id !== card.columnId) {
                                            execMove({
                                                cardId: card.id,
                                                targetColumnId: column.id,
                                                targetPosition:
                                                    APPEND_TO_END,
                                            })
                                        }
                                        close()
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {submenu === 'tags' && (
                        <div className="flex flex-col">
                            <button
                                type="button"
                                onClick={() => setSubmenu('root')}
                                className="mb-1 px-2 py-1 text-left text-xs text-slate-400 hover:text-slate-600"
                            >
                                ← Voltar
                            </button>
                            {availableTags.length === 0 && (
                                <p className="px-2 py-1.5 text-xs text-slate-400">
                                    Nenhuma tag criada ainda.
                                </p>
                            )}
                            {availableTags.map((t) => {
                                const attached = attachedIds.has(t.id)
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() =>
                                            execToggleTag({
                                                cardId: card.id,
                                                tagId: t.id,
                                                attach: !attached,
                                            })
                                        }
                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        <span
                                            className="size-2.5 rounded-full"
                                            style={{
                                                backgroundColor: t.color,
                                            }}
                                        />
                                        <span className="flex-1">
                                            {t.name}
                                        </span>
                                        {attached && (
                                            <span className="text-xs text-blue-600">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deletar card?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O card{' '}
                            <span className="font-semibold">
                                &ldquo;{card.name}&rdquo;
                            </span>{' '}
                            será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => execDelete({ id: card.id })}
                            className="bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)] hover:opacity-90"
                        >
                            Deletar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function MenuButton({
    icon,
    label,
    onClick,
    danger,
    active,
}: {
    icon?: React.ReactNode
    label: string
    onClick: () => void
    danger?: boolean
    active?: boolean
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition ${
                danger
                    ? 'text-red-600 hover:bg-red-50'
                    : active
                        ? 'bg-slate-50 font-medium text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
            }`}
        >
            {icon}
            {label}
        </button>
    )
}
