'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'

import { createWeekTask } from '../_actions/create-week-task'

interface QuickWeekTaskProps {
    plannedDate: string
}

export function QuickWeekTask({
    plannedDate,
}: QuickWeekTaskProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [area, setArea] = useState<
        'WORK' | 'STUDIES' | 'PERSONAL'
    >('WORK')

    const [isPending, startTransition] = useTransition()

    function handleSubmit() {
        if (!title.trim()) {
            return
        }

        startTransition(async () => {
            await createWeekTask({
                title,
                area,
                plannedDate,
            })

            setTitle('')
            setArea('WORK')
            setOpen(false)
        })
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
                <Plus className="size-4" />
                Nova tarefa
            </button>
        )
    }

    return (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-start gap-2">
                <input
                    autoFocus
                    value={title}
                    onChange={(event) =>
                        setTitle(event.target.value)
                    }
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            handleSubmit()
                        }

                        if (event.key === 'Escape') {
                            setOpen(false)
                        }
                    }}
                    placeholder="Nome da tarefa..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-slate-400 transition hover:text-slate-600"
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <select
                    value={area}
                    onChange={(event) =>
                        setArea(
                            event.target.value as
                            | 'WORK'
                            | 'STUDIES'
                            | 'PERSONAL',
                        )
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none"
                >
                    <option value="WORK">
                        Trabalho
                    </option>

                    <option value="STUDIES">
                        Estudos
                    </option>

                    <option value="PERSONAL">
                        Pessoal
                    </option>
                </select>

                <button
                    type="button"
                    disabled={
                        isPending || !title.trim()
                    }
                    onClick={handleSubmit}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending
                        ? 'Salvando...'
                        : 'Adicionar'}
                </button>
            </div>
        </div>
    )
}