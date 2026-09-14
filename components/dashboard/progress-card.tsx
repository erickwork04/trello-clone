import { Clock3 } from 'lucide-react'

interface ProgressCardProps {
    completed: number
    total: number
}

export function ProgressCard({
    completed,
    total,
}: ProgressCardProps) {
    const percentage =
        total === 0
            ? 0
            : Math.round((completed / total) * 100)

    const degrees = (percentage / 100) * 360

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Clock3 className="size-5 text-slate-500" />

                <h2 className="font-semibold text-slate-900">
                    Progresso do dia
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <div className="relative flex size-24 shrink-0 items-center justify-center">
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(
                #2563eb 0deg ${degrees}deg,
                #e2e8f0 ${degrees}deg 360deg
              )`,
                        }}
                    />

                    <div className="absolute inset-2.25 rounded-full bg-white" />

                    <span className="relative text-xl font-bold text-slate-900">
                        {percentage}%
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800">
                        {completed} de {total} tarefas concluídas
                    </p>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{
                                width: `${percentage}%`,
                            }}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}