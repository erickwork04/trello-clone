'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { createTask } from '@/app/(app)/hoje/_actions/create-task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

interface NewPersonalTaskButtonProps {
    availableTags: Array<{ id: string; name: string; color: string }>
}

function getTodayString() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function NewPersonalTaskButton({
    availableTags,
}: NewPersonalTaskButtonProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [plannedDate, setPlannedDate] = useState(getTodayString())
    const [plannedTime, setPlannedTime] = useState('')
    const [priority, setPriority] = useState<Priority>('MEDIUM')
    const [tagIds, setTagIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    function resetForm() {
        setTitle('')
        setDescription('')
        setPlannedDate(getTodayString())
        setPlannedTime('')
        setPriority('MEDIUM')
        setTagIds([])
    }

    async function handleSubmit() {
        if (!title.trim() || !plannedDate) return

        try {
            setIsSubmitting(true)

            const result = await createTask({
                destination: 'TODAY',
                title,
                description: description || undefined,
                area: 'PERSONAL',
                priority,
                plannedDate,
                plannedTime: plannedTime || undefined,
                tagIds: tagIds.length > 0 ? tagIds : undefined,
            })

            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }

            resetForm()
            setOpen(false)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">
                    + Nova tarefa
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                side="bottom"
                sideOffset={12}
                collisionPadding={16}
                className="max-h-[70vh] w-90 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            >
                <div className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Nova tarefa pessoal
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Adicione algo da sua rotina, saúde ou compromissos.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personal-title">Título</Label>
                        <Input
                            id="personal-title"
                            placeholder="Ex.: Marcar consulta médica"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit()
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personal-description">
                            Descrição (opcional)
                        </Label>
                        <Input
                            id="personal-description"
                            placeholder="Detalhes, se precisar"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="personal-date">Data</Label>
                            <Input
                                id="personal-date"
                                type="date"
                                value={plannedDate}
                                onChange={(e) => setPlannedDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personal-time">
                                Horário (opcional)
                            </Label>
                            <Input
                                id="personal-time"
                                type="time"
                                value={plannedTime}
                                onChange={(e) => setPlannedTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Prioridade</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['LOW', 'MEDIUM', 'HIGH'] as Priority[]).map(
                                (p) => (
                                    <Button
                                        key={p}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPriority(p)}
                                        className={
                                            priority === p
                                                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                                : ''
                                        }
                                    >
                                        {p === 'LOW'
                                            ? 'Baixa'
                                            : p === 'MEDIUM'
                                                ? 'Média'
                                                : 'Alta'}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>

                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((t) => {
                                    const active = tagIds.includes(t.id)
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() =>
                                                setTagIds((current) =>
                                                    active
                                                        ? current.filter(
                                                            (id) => id !== t.id
                                                        )
                                                        : [...current, t.id]
                                                )
                                            }
                                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                                active
                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor: t.color,
                                                }}
                                            />
                                            {t.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <Button
                        className="w-full rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
                        disabled={isSubmitting || !title.trim() || !plannedDate}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? 'Adicionando...' : 'Adicionar tarefa'}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
