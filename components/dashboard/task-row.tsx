'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Clock3, Star } from 'lucide-react'
import { toast } from 'sonner'
import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { AreaBadge } from './area-badge'
import { toggleTopPriority } from '@/app/(app)/hoje/_actions/toggle-top-priority'
import { TaskActions } from './task-actions'

interface TaskRowProps {
    id: string
    title: string
    description?: string | null
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
    time?: string | null
    completed?: boolean
    topPriority?: boolean
    allowPriority?: boolean
    /**
     * Mostra "Definir como foco" no menu "...". Só faz sentido na
     * página Hoje — os demais usos de TaskRow simplesmente não
     * passam essa prop.
     */
    allowFocus?: boolean
    /** Esta é a tarefa atualmente selecionada como foco (?focus=id). */
    isFocusTask?: boolean
    /**
     * Id da tarefa com sessão de foco ativa (rodando ou pausada),
     * se houver — independente de qual tarefa está selecionada.
     * Usado só pra bloquear troca de seleção com sessão ativa em
     * outra tarefa.
     */
    activeSessionTaskId?: string | null
}

export function TaskRow({
    id,
    title,
    description,
    area,
    time,
    completed = false,
    topPriority = false,
    allowPriority = false,
    allowFocus = false,
    isFocusTask = false,
    activeSessionTaskId = null,
}: TaskRowProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function handleSetFocus() {
        if (activeSessionTaskId && activeSessionTaskId !== id) {
            toast.error(
                'Já existe uma sessão de foco ativa em outra tarefa. Finalize-a antes de escolher outra.'
            )
            return
        }

        const params = new URLSearchParams(searchParams.toString())
        params.set('focus', id)
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }

    function clearFocusSelection() {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('focus')
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
        })
    }

    function handlePriority() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            const result = await toggleTopPriority({
                taskId: id,
                currentValue: topPriority,
            })

            if (result?.serverError) {
                toast.error(result.serverError)
            }
        })
    }

    function handleComplete() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            const result = await completeTask({
                taskId: id,
                completed,
            })

            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }

            // Concluir a tarefa que estava em foco limpa a seleção
            // (?focus=) — completeTask já finaliza a sessão ativa
            // dela no servidor; aqui só tiramos o parâmetro da URL,
            // já que isso é estado do navegador, não do banco.
            if (!completed && isFocusTask) {
                clearFocusSelection()
            }
        })
    }

    return (
        <div
            className={[
                'flex items-start gap-3 p-3',
                isPending ? 'opacity-50' : '',
            ].join(' ')}
        >
            <input
                type="checkbox"
                checked={completed}
                disabled={isPending}
                onChange={handleComplete}
                className="mt-1 size-4 shrink-0 rounded border-slate-300"
            />

            <div className="min-w-0 flex-1">
                <p
                    className={[
                        'text-sm',
                        completed
                            ? 'text-slate-400 line-through'
                            : 'font-medium text-slate-800',
                    ].join(' ')}
                >
                    {title}
                </p>

                {description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {allowPriority && !completed && (
                        <button
                            type="button"
                            onClick={handlePriority}
                            disabled={isPending}
                            title={
                                topPriority
                                    ? 'Remover das prioridades'
                                    : 'Adicionar às prioridades'
                            }
                        >
                            <Star
                                className={[
                                    'size-4 transition',
                                    topPriority
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 hover:text-amber-400',
                                ].join(' ')}
                            />
                        </button>
                    )}

                    <AreaBadge area={area} />

                    {time && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock3 className="size-3.5" />
                            {time.slice(0, 5)}
                        </span>
                    )}
                </div>
            </div>

            <TaskActions
                taskId={id}
                title={title}
                description={description}
                time={time}
                onSetFocus={
                    allowFocus && !completed
                        ? handleSetFocus
                        : undefined
                }
            />
        </div>
    )
}