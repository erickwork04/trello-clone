'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'

import { Button } from '@/components/ui/button'

import { cardNameSchema } from '@/lib/validators/card'
import { createCard } from '@/app/(app)/board/actions'

const schema = z.object({
    name: cardNameSchema,
})

type FormValues = z.infer<typeof schema>

interface CreateCardButtonProps {
    columnId: string
}

export function CreateCardButton({
    columnId,
}: CreateCardButtonProps) {
    const [open, setOpen] =
        useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: {
            errors,
        },
    } = useForm<FormValues>({
        resolver:
            zodResolver(schema),

        defaultValues: {
            name: '',
        },
    })

    const {
        execute,
        isExecuting,
    } = useAction(createCard, {
        onSuccess: () => {
            toast.success(
                'Tarefa criada!'
            )

            reset()
            setOpen(false)
        },

        onError: () => {
            toast.error(
                'Erro ao criar tarefa.'
            )
        },
    })

    function onSubmit(
        data: FormValues
    ) {
        execute({
            columnId,
            name: data.name,
        })
    }

    function handleClose() {
        reset()
        setOpen(false)
    }

    if (!open) {
        return (
            <button
                type="button"
                onClick={() =>
                    setOpen(true)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/50 px-3 py-2.5 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-white"
            >
                <Plus className="size-4" />

                Nova tarefa
            </button>
        )
    }

    return (
        <form
            onSubmit={
                handleSubmit(
                    onSubmit
                )
            }
            className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
            <textarea
                {...register('name')}
                placeholder="Digite a tarefa..."
                autoFocus
                disabled={
                    isExecuting
                }
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                onKeyDown={(
                    event
                ) => {
                    if (
                        event.key ===
                        'Escape'
                    ) {
                        handleClose()
                    }

                    if (
                        event.key ===
                        'Enter' &&
                        !event.shiftKey
                    ) {
                        event.preventDefault()

                        handleSubmit(
                            onSubmit
                        )()
                    }
                }}
                aria-invalid={
                    !!errors.name
                }
            />

            {errors.name && (
                <p className="text-xs text-red-500">
                    {
                        errors.name
                            .message
                    }
                </p>
            )}

            <div className="flex gap-2">
                <Button
                    type="submit"
                    size="sm"
                    disabled={
                        isExecuting
                    }
                    className="h-8 flex-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
                >
                    {isExecuting
                        ? 'Criando...'
                        : 'Criar tarefa'}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={
                        handleClose
                    }
                    disabled={
                        isExecuting
                    }
                    aria-label="Cancelar"
                >
                    <X className="size-4" />
                </Button>
            </div>
        </form>
    )
}