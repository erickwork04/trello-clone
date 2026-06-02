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

const schema = z.object({ name: cardNameSchema })
type FormValues = z.infer<typeof schema>

interface CreateCardButtonProps {
    columnId: string
}

export function CreateCardButton({ columnId }: CreateCardButtonProps) {
    const [open, setOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: '' },
    })

    const { execute, isExecuting } = useAction(createCard, {
        onSuccess: () => {
            toast.success('Card criado!')
            reset()
            setOpen(false)
        },
        onError: () => toast.error('Erro ao criar card.'),
    })

    const onSubmit = (data: FormValues) => {
        execute({ columnId, name: data.name })
    }

    const handleClose = () => {
        reset()
        setOpen(false)
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--border)] transition-colors text-xs font-medium"
                aria-label="Adicionar card"
            >
                <Plus size={13} />
                Adicionar card
            </button>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-2"
            >
                <textarea
                    {...register('name')}
                    placeholder="Nome do card"
                    autoFocus
                    disabled={isExecuting}
                    rows={2}
                    className="w-full px-2.5 py-2 text-sm bg-[color:var(--card)] border border-[color:var(--border)] rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-[color:var(--primary)]"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') handleClose()
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit(onSubmit)()
                        }
                    }}
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p className="text-xs text-[color:var(--destructive)]">
                        {errors.name.message}
                    </p>
                )}
                <div className="flex gap-2">
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isExecuting}
                        className="h-7 text-xs flex-1"
                    >
                        {isExecuting ? 'Criando...' : 'Criar card'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={handleClose}
                        disabled={isExecuting}
                        aria-label="Cancelar"
                    >
                        <X size={13} />
                    </Button>
                </div>
            </form>
        </div>
    )
}
