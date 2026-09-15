import { Clock3, Target } from 'lucide-react'
import { AreaBadge } from './area-badge'
import { FocusTimer } from './focus-timer'

interface FocusCardProps {
    title: string
    description?: string | null
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
    time?: string | null
    estimatedTime?: string
    taskId: string

    activeSession?: {
        id: string
        taskId: string
        startedAt: string
    } | null
}

export function FocusCard({
    title,
    description,
    area,
    time,
    estimatedTime,
    taskId,
    activeSession,
}: FocusCardProps) {
    return (
        <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Target className="size-5" />
                    </div>

                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Foco de hoje
                        </h2>

                        <p className="text-sm text-slate-500">
                            Concentre-se em uma tarefa. O resto pode esperar.
                        </p>
                    </div>
                </div>

                <span className="hidden text-sm font-medium italic text-blue-500 md:block">
                    Você consegue! ✨
                </span>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                    <input
                        type="checkbox"
                        className="mt-1 size-5 rounded border-slate-300"
                    />

                    <div>
                        <h3 className="font-semibold text-slate-900">
                            {title}
                        </h3>

                        {description && (
                            <p className="mt-1 text-sm text-slate-500">
                                {description}
                            </p>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                            <AreaBadge area={area} />

                            {time && (
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock3 className="size-3.5" />
                                    {time.slice(0, 5)}
                                </span>
                            )}

                            {estimatedTime && (
                                <span className="text-xs text-slate-500">
                                    • {estimatedTime}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <FocusTimer
                    taskId={taskId}
                    activeSession={activeSession}
                />
            </div>
        </section>
    )
}