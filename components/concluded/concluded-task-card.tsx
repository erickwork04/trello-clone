'use client'

import { useTransition } from 'react'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { AreaBadge } from '@/components/dashboard/area-badge'

export interface ConcludedTask {
    id: string
    title: string
    description: string | null
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    completedAt: Date | null
    tags: Array<{ id: string; name: string; color: string }>
}

const PRIORITY_LABELS: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
}

export function ConcludedTaskCard({ task }: { task: ConcludedTask }) {
    const [isPending, startTransition] = useTransition()

    function handleReopen() {
        if (isPending) return

        startTransition(async () => {
            // completeTask já lida com o toggle: como a tarefa está
            // concluída, chamar com completed=true faz ela voltar
            // pro status informado em returnStatus (default 'TODAY',
            // mesmo comportamento já usado ao desconcluir em Hoje).
            const result = await completeTask({
                taskId: task.id,
                completed: true,
            })

            if (result?.serverError) {
                toast.error(result.serverError)
            }
        })
    }

    return (
        <div
            className={`flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition sm:flex-row sm:items-start sm:justify-between ${
                isPending ? 'opacity-50' : ''
            }`}
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-500 line-through">
                    {task.title}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AreaBadge area={task.area} />

                    {task.priority === 'HIGH' && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                            {PRIORITY_LABELS[task.priority]}
                        </span>
                    )}

                    {task.tags.map((t) => (
                        <span
                            key={t.id}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                                backgroundColor: `${t.color}20`,
                                color: t.color,
                            }}
                        >
                            <span
                                className="size-1.5 rounded-full"
                                style={{ backgroundColor: t.color }}
                            />
                            {t.name}
                        </span>
                    ))}

                    <span className="text-xs text-slate-400">
                        {task.completedAt
                            ? `Concluída em ${task.completedAt.toLocaleDateString(
                                  'pt-BR',
                                  {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  }
                              )}`
                            : 'Data de conclusão não registrada'}
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleReopen}
                disabled={isPending}
                className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
            >
                <RotateCcw className="size-3.5" />
                Reabrir
            </button>
        </div>
    )
}
