'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/db/schema/card'
import { cardNameSchema } from '@/lib/validators/card'
import { updateCard, deleteCard } from '@/app/(app)/board/actions'

const nameSchema = z.object({ name: cardNameSchema })
type NameForm = z.infer<typeof nameSchema>

interface CardItemProps {
    card: Card
}

export function CardItem({ card }: CardItemProps) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { type: 'card', columnId: card.columnId },
    })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    const { register, handleSubmit, setValue } = useForm<NameForm>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: card.name },
    })

    const { execute: execUpdate } = useAction(updateCard, {
        onError: () => {
            setValue('name', card.name)
            toast.error('Erro ao atualizar card.')
        },
    })

    const { execute: execDelete } = useAction(deleteCard, {
        onSuccess: () => toast.success('Card removido.'),
        onError: () => toast.error('Erro ao deletar card.'),
    })

    const onBlur = handleSubmit((data) => {
        if (data.name !== card.name) {
            execUpdate({ id: card.id, name: data.name })
        }
    })

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            e.preventDefault()
            inputRef.current?.blur()
        }
    }

    const { ref: registerRef, ...registerRest } = register('name')

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="group bg-[color:var(--card)] rounded-md border border-[color:var(--border)] px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-2 touch-none"
        >
            <input
                {...registerRest}
                ref={(el) => {
                    registerRef(el)
                    inputRef.current = el
                }}
                onBlur={onBlur}
                onKeyDown={handleKeyDown}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex-1 min-w-0 text-sm text-[color:var(--foreground)] bg-transparent border-none outline-none focus:ring-0 focus:outline-none cursor-text"
                aria-label="Nome do card"
            />

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)] transition-opacity"
                        aria-label="Deletar card"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={11} />
                    </Button>
                </AlertDialogTrigger>
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
        </div>
    )
}
