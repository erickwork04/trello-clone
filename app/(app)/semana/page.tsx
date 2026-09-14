import { headers } from 'next/headers'
import { CalendarDays } from 'lucide-react'

import { auth } from '@/lib/auth'
import { getWeekTasks } from './_queries/get-week-tasks'
import { TaskRow } from '@/components/dashboard/task-row'

const areaMap = {
    WORK: 'Trabalho',
    STUDIES: 'Estudos',
    PERSONAL: 'Pessoal',
    INBOX: 'Pessoal',
} as const

function getStartOfWeek(date: Date) {
    const result = new Date(date)

    const day = result.getDay()

    const diff = day === 0 ? -6 : 1 - day

    result.setDate(result.getDate() + diff)
    result.setHours(0, 0, 0, 0)

    return result
}

function getEndOfWeek(start: Date) {
    const end = new Date(start)

    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return end
}

function formatDay(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
    }).format(date)
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
    }).format(date)
}

function getDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

export default async function SemanaPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    const today = new Date()

    const startOfWeek = getStartOfWeek(today)
    const endOfWeek = getEndOfWeek(startOfWeek)

    const weekTasks = await getWeekTasks(
        session.user.id,
        startOfWeek,
        endOfWeek
    )

    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek)

        date.setDate(date.getDate() + index)

        return date
    })

    const completedCount = weekTasks.filter(
        (task) => task.status === 'DONE'
    ).length

    const totalCount = weekTasks.length

    const percentage =
        totalCount === 0
            ? 0
            : Math.round(
                (completedCount / totalCount) * 100
            )

    return (
        <div className="h-full overflow-y-auto">
            <div className="w-full px-8 py-6 2xl:px-10">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <CalendarDays className="size-7 text-blue-600" />

                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                Minha Semana
                            </h1>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            Organize sua semana com mais clareza e menos estresse.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            Progresso da semana
                        </p>

                        <div className="mt-2 flex items-center gap-4">
                            <span className="text-2xl font-bold">
                                {percentage}%
                            </span>

                            <span className="text-sm text-slate-500">
                                {completedCount} de {totalCount} concluídas
                            </span>
                        </div>

                        <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                    width: `${percentage}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-7">
                    {days.map((day) => {
                        const dayKey = getDateKey(day)

                        const dayTasks = weekTasks.filter((task) => {
                            if (!task.plannedDate) {
                                return false
                            }

                            return getDateKey(task.plannedDate) === dayKey
                        })

                        const isToday =
                            day.toDateString() ===
                            today.toDateString()

                        return (
                            <section
                                key={day.toISOString()}
                                className={[
                                    'min-h-105 rounded-2xl border bg-white p-4 shadow-sm',
                                    isToday
                                        ? 'border-blue-400 ring-1 ring-blue-200'
                                        : 'border-slate-200',
                                ].join(' ')}
                            >
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold capitalize text-slate-900">
                                            {formatDay(day)}
                                        </h2>

                                        {isToday && (
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                Hoje
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {formatDate(day)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {dayTasks.length > 0 ? (
                                        dayTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="rounded-xl border border-slate-200 bg-slate-50/50"
                                            >
                                                <TaskRow
                                                    id={task.id}
                                                    title={task.title}
                                                    area={areaMap[task.area]}
                                                    completed={task.status === 'DONE'}
                                                    topPriority={task.isTopPriority}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                                            Nenhuma tarefa
                                        </p>
                                    )}
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}