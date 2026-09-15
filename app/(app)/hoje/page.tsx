import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

import {
    CircleCheckBig,
    ListTodo,
    Star,
} from 'lucide-react'

import { DashboardSection } from '@/components/dashboard/dashboard-section'
import { TaskRow } from '@/components/dashboard/task-row'
import { FocusCard } from '@/components/dashboard/focus-card'
import { ProgressCard } from '@/components/dashboard/progress-card'
import { CreateTaskButton } from '@/components/dashboard/create-task-button'
import { FocusTimeStat } from '@/components/dashboard/focus-time-stat'

import { getTodayData } from './_queries/get-today-data'
import { getFocusData } from './_queries/get-focus-data'

export default async function HojePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    const {
        todayTasks,
        completedToday,
        topPriorities,
        completedCount,
        totalCount,
    } = await getTodayData(session.user.id)

    const focusData = await getFocusData(session.user.id)

    const userName =
        session.user.name?.split(' ')[0] ??
        'Usuário'

    const today = new Intl.DateTimeFormat(
        'pt-BR',
        {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
        }
    ).format(new Date())

    const formattedDate =
        today.charAt(0).toUpperCase() +
        today.slice(1)

    const areaMap = {
        WORK: 'Trabalho',
        STUDIES: 'Estudos',
        PERSONAL: 'Pessoal',
        INBOX: 'Pessoal',
    } as const

    const focusTask =
        topPriorities[0] ??
        todayTasks[0] ??
        null

    function getGreeting() {
        const hour = new Date().getHours()

        if (hour < 12) {
            return {
                text: 'Bom dia',
                emoji: '☀️',
            }
        }

        if (hour < 18) {
            return {
                text: 'Boa tarde',
                emoji: '🌤️',
            }
        }

        return {
            text: 'Boa noite',
            emoji: '🌙',
        }
    }

    const greeting = getGreeting()

    return (
        <div className="h-full overflow-y-auto">
            <div className="w-full px-8 py-6 2xl:px-10">

                {/* CABEÇALHO */}
                <div className="mb-6 flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {greeting.text},{' '}
                            {userName}{' '}
                            {greeting.emoji}
                        </h1>

                        <p className="mt-1 text-base font-medium text-slate-500">
                            {formattedDate}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Hoje é um bom dia para
                            construir a vida que você
                            quer. 💙
                        </p>
                    </div>

                    <div className="hidden max-w-sm rounded-2xl bg-blue-50 px-6 py-4 text-blue-600 xl:block">
                        <p className="text-lg italic">
                            “Mais foco, menos pressão,
                            resultados reais.”
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">

                    {/* COLUNA PRINCIPAL */}
                    <div className="space-y-3">

                        {/* FOCO */}
                        {focusTask ? (
                            <FocusCard
                                taskId={
                                    focusTask.id
                                }
                                title={
                                    focusTask.title
                                }
                                description={
                                    focusTask.description
                                }
                                area={
                                    areaMap[
                                    focusTask
                                        .area
                                    ]
                                }
                                time={
                                    focusTask.plannedTime
                                }
                                estimatedTime={
                                    focusTask.estimatedMinutes
                                        ? `${focusTask.estimatedMinutes} min`
                                        : undefined
                                }
                                activeSession={
                                    focusData.activeSession
                                        ? {
                                            id:
                                                focusData
                                                    .activeSession
                                                    .id,

                                            taskId:
                                                focusData
                                                    .activeSession
                                                    .taskId,

                                            startedAt:
                                                focusData
                                                    .activeSession
                                                    .startedAt
                                                    .toISOString(),
                                        }
                                        : null
                                }
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                                Nenhuma tarefa para
                                focar hoje.
                            </div>
                        )}

                        {/* PRIORIDADES */}
                        <DashboardSection
                            icon={
                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                                    <Star className="size-5" />
                                </div>
                            }
                            title="3 prioridades"
                            description="Menos é mais. Foque primeiro nessas tarefas."
                        >
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                {topPriorities.length >
                                    0 ? (
                                    topPriorities.map(
                                        (task) => (
                                            <TaskRow
                                                key={
                                                    task.id
                                                }
                                                id={
                                                    task.id
                                                }
                                                title={
                                                    task.title
                                                }
                                                description={
                                                    task.description
                                                }
                                                area={
                                                    areaMap[
                                                    task
                                                        .area
                                                    ]
                                                }
                                                time={
                                                    task.plannedTime
                                                }
                                                completed={
                                                    task.status ===
                                                    'DONE'
                                                }
                                                topPriority={
                                                    task.isTopPriority
                                                }
                                                allowPriority={
                                                    task.status !==
                                                    'DONE'
                                                }
                                            />
                                        )
                                    )
                                ) : (
                                    <p className="p-4 text-sm text-slate-500">
                                        Nenhuma prioridade
                                        principal definida.
                                    </p>
                                )}
                            </div>
                        </DashboardSection>

                        {/* TAREFAS DE HOJE */}
                        <DashboardSection
                            icon={
                                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <ListTodo className="size-5" />
                                </div>
                            }
                            title="Tarefas de hoje"
                            description="Demais tarefas planejadas para o dia."
                            action={
                                <CreateTaskButton />
                            }
                        >
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                {todayTasks.length >
                                    0 ? (
                                    todayTasks.map(
                                        (task) => (
                                            <TaskRow
                                                key={
                                                    task.id
                                                }
                                                id={
                                                    task.id
                                                }
                                                title={
                                                    task.title
                                                }
                                                description={
                                                    task.description
                                                }
                                                area={
                                                    areaMap[
                                                    task
                                                        .area
                                                    ]
                                                }
                                                time={
                                                    task.plannedTime
                                                }
                                                completed={
                                                    task.status ===
                                                    'DONE'
                                                }
                                                topPriority={
                                                    task.isTopPriority
                                                }
                                                allowPriority={
                                                    task.status !==
                                                    'DONE'
                                                }
                                            />
                                        )
                                    )
                                ) : (
                                    <p className="p-4 text-sm text-slate-500">
                                        Nenhuma tarefa
                                        planejada para hoje.
                                    </p>
                                )}
                            </div>
                        </DashboardSection>

                        {/* CONCLUÍDAS */}
                        <DashboardSection
                            icon={
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <CircleCheckBig className="size-5" />
                                </div>
                            }
                            title="Concluídas hoje"
                            description="Veja o que você já avançou hoje."
                        >
                            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                                {completedToday.length >
                                    0 ? (
                                    completedToday.map(
                                        (task) => (
                                            <TaskRow
                                                key={
                                                    task.id
                                                }
                                                id={
                                                    task.id
                                                }
                                                title={
                                                    task.title
                                                }
                                                description={
                                                    task.description
                                                }
                                                area={
                                                    areaMap[
                                                    task
                                                        .area
                                                    ]
                                                }
                                                time={
                                                    task.plannedTime
                                                }
                                                completed={
                                                    true
                                                }
                                                topPriority={
                                                    task.isTopPriority
                                                }
                                                allowPriority={
                                                    false
                                                }
                                            />
                                        )
                                    )
                                ) : (
                                    <p className="p-4 text-sm text-slate-500">
                                        Nenhuma tarefa
                                        concluída hoje.
                                    </p>
                                )}
                            </div>
                        </DashboardSection>
                    </div>

                    {/* LATERAL */}
                    <aside className="space-y-4">

                        <ProgressCard
                            completed={
                                completedCount
                            }
                            total={
                                totalCount
                            }
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FocusTimeStat
                                totalSeconds={
                                    focusData.totalSeconds
                                }
                            />
                        </div>

                        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                            <p className="font-medium text-blue-900">
                                Lembre-se
                            </p>

                            <p className="mt-2 text-sm leading-6 text-blue-700">
                                Você não precisa fazer
                                tudo hoje. Foque no que
                                realmente importa.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    )
}