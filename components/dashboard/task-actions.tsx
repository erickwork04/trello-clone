'use client'

import { useState, useTransition } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

import { deleteTask } from '@/app/(app)/hoje/_actions/delete-task'
import { updateTask } from '@/app/(app)/hoje/_actions/update-task'

interface TaskActionsProps {
    taskId: string
    title: string
    description?: string | null
    time?: string | null
}

export function TaskActions({
    taskId,
    title,
    description,
    time,
}: TaskActionsProps) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<'menu' | 'edit' | 'delete'>('menu')

    const [editTitle, setEditTitle] = useState(title)
    const [editDescription, setEditDescription] = useState(description ?? '')
    const [editTime, setEditTime] = useState(time?.slice(0, 5) ?? '')

    const [isPending, startTransition] = useTransition()

    function reset() {
        setMode('menu')
        setEditTitle(title)
        setEditDescription(description ?? '')
        setEditTime(time?.slice(0, 5) ?? '')
    }

    function handleUpdate() {
        if (!editTitle.trim()) return

        startTransition(async () => {
            await updateTask({
                taskId,
                title: editTitle,
                description: editDescription,
                plannedTime: editTime,
            })

            setOpen(false)
            reset()
        })
    }

    function handleDelete() {
        startTransition(async () => {
            await deleteTask(taskId)

            setOpen(false)
            reset()
        })
    }

    return (
        <Popover
            open={open}
            onOpenChange={(value) => {
                setOpen(value)

                if (!value) {
                    reset()
                }
            }}
        >
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Opções"
                >
                    <MoreVertical className="size-4" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className={
                    mode === 'menu'
                        ? 'w-37.5 p-2'
                        : mode === 'edit'
                            ? 'w-[320px] p-3'
                            : 'w-57.5 p-3'
                }
            >
                {mode === 'menu' && (
                    <div className="space-y-1">
                        <button
                            type="button"
                            onClick={() => setMode('edit')}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-100"
                        >
                            <Pencil className="size-4" />
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode('delete')}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="size-4" />
                            Excluir
                        </button>
                    </div>
                )}

                {mode === 'edit' && (
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-semibold">
                                Editar tarefa
                            </p>
                        </div>

                        <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Título"
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        />

                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Observação"
                            className="min-h-20 w-full resize-none rounded-md border px-3 py-2 text-sm"
                        />

                        <input
                            type="time"
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('menu')}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleUpdate}
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isPending ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'delete' && (
                    <div className="space-y-4">
                        <div>
                            <p className="font-semibold text-slate-900">
                                Excluir tarefa?
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Essa ação não pode ser desfeita.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('menu')}
                                className="rounded-md border px-3 py-2 text-sm"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleDelete}
                                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}