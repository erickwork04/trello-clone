'use client'

import { useState } from 'react'

import { createTask } from '@/app/(app)/hoje/_actions/create-task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

type Area = 'WORK' | 'STUDIES' | 'PERSONAL'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export function CreateTaskButton() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [area, setArea] = useState<Area>('WORK')
    type Destination = 'TODAY' | 'INBOX'

    const [destination, setDestination] =
        useState<Destination>('TODAY')
    const [priority, setPriority] = useState<Priority>('MEDIUM')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const getTodayString = () => {
        const today = new Date()

        const year = today.getFullYear()
        const month = String(
            today.getMonth() + 1
        ).padStart(2, '0')

        const day = String(
            today.getDate()
        ).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const getTomorrowString = () => {
        const tomorrow = new Date()

        tomorrow.setDate(tomorrow.getDate() + 1)

        const year = tomorrow.getFullYear()
        const month = String(
            tomorrow.getMonth() + 1
        ).padStart(2, '0')

        const day = String(
            tomorrow.getDate()
        ).padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const [plannedDate, setPlannedDate] =
        useState(getTodayString())

    async function handleSubmit() {
        if (!title.trim()) {
            return
        }

        try {
            setIsSubmitting(true)

            await createTask({
                title,
                destination,
                area:
                    destination === 'TODAY'
                        ? area
                        : undefined,
                priority:
                    destination === 'TODAY'
                        ? priority
                        : undefined,
                plannedDate:
                    destination === 'TODAY'
                        ? plannedDate
                        : undefined,
            })

            setTitle('')
            setArea('WORK')
            setPriority('MEDIUM')
            setPlannedDate(getTodayString())
            setOpen(false)
            setDestination('TODAY')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                    + Nova tarefa
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-80 space-y-4"
            >
                <div>
                    <h3 className="font-semibold">
                        Nova tarefa
                    </h3>

                    <p className="text-sm text-muted-foreground">
                        Adicione rapidamente uma tarefa para hoje.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title">
                        Tarefa
                    </Label>

                    <Input
                        id="title"
                        placeholder="Ex.: Finalizar relatório"
                        value={title}
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleSubmit()
                            }
                        }}
                    />
                </div>

                <div className="space-y-2">
                    <Label>
                        Onde colocar?
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDestination('TODAY')}
                            className={
                                destination === 'TODAY'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Hoje
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDestination('INBOX')}
                            className={
                                destination === 'INBOX'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Caixa de Entrada
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>
                        Área
                    </Label>

                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setArea('WORK')}
                            className={
                                area === 'WORK'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }

                        >
                            Trabalho
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setArea('STUDIES')}
                            className={
                                area === 'STUDIES'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Estudos
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setArea('PERSONAL')}
                            className={
                                area === 'PERSONAL'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Pessoal
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setPlannedDate(getTodayString())
                        }
                        className={
                            plannedDate === getTodayString()
                                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                : ''
                        }
                    >
                        Hoje
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            setPlannedDate(getTomorrowString())
                        }
                        className={
                            plannedDate === getTomorrowString()
                                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                : ''
                        }
                    >
                        Amanhã
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="plannedDate">
                        Quando?
                    </Label>

                    <Input
                        id="plannedDate"
                        type="date"
                        value={plannedDate}
                        onChange={(event) =>
                            setPlannedDate(event.target.value)
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label>
                        Prioridade
                    </Label>

                    <div className="grid grid-cols-3 gap-2 ">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPriority('LOW')}
                            className={
                                priority === 'LOW'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Baixa
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPriority('MEDIUM')}
                            className={
                                priority === 'MEDIUM'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Média
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPriority('HIGH')}
                            className={
                                priority === 'HIGH'
                                    ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                                    : ''
                            }
                        >
                            Alta
                        </Button>
                    </div>
                </div>

                <Button
                    className="w-full rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
                    disabled={isSubmitting ||
                        !title.trim() ||
                        (destination === 'TODAY' && !plannedDate)}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar tarefa'}

                </Button>
            </PopoverContent>
        </Popover>
    )
}