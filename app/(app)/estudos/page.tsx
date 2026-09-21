import { headers } from 'next/headers'
import { and, asc, eq, inArray, ne } from 'drizzle-orm'
import { GraduationCap } from 'lucide-react'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { taskTag } from '@/db/schema/task-tag'
import { tag } from '@/db/schema/tag'
import { StudyView } from '@/components/studies/study-view'

function startOfWeek(date: Date) {
    const result = new Date(date)
    const day = result.getDay()
    // Semana começa na segunda-feira.
    const diff = day === 0 ? -6 : 1 - day
    result.setDate(result.getDate() + diff)
    result.setHours(0, 0, 0, 0)
    return result
}

export default async function EstudosPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    const tasks = await db
        .select()
        .from(task)
        .where(
            and(
                eq(task.userId, session.user.id),
                eq(task.area, 'STUDIES'),
                ne(task.status, 'CANCELED')
            )
        )
        .orderBy(asc(task.position), asc(task.createdAt))

    const taskIds = tasks.map((t) => t.id)

    const [userTags, taskTagRows] = await Promise.all([
        db
            .select()
            .from(tag)
            .where(eq(tag.userId, session.user.id))
            .orderBy(asc(tag.name)),

        taskIds.length > 0
            ? db
                .select({
                    taskId: taskTag.taskId,
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                })
                .from(taskTag)
                .innerJoin(tag, eq(taskTag.tagId, tag.id))
                .where(inArray(taskTag.taskId, taskIds))
            : Promise.resolve([]),
    ])

    const tagsByTaskId = new Map<
        string,
        Array<{ id: string; name: string; color: string }>
    >()

    for (const row of taskTagRows) {
        const current = tagsByTaskId.get(row.taskId) ?? []
        current.push({ id: row.id, name: row.name, color: row.color })
        tagsByTaskId.set(row.taskId, current)
    }

    const tasksWithTags = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status as 'BACKLOG' | 'WEEK' | 'TODAY' | 'DOING' | 'DONE',
        priority: t.priority,
        isTopPriority: t.isTopPriority,
        plannedDate: t.plannedDate,
        plannedTime: t.plannedTime,
        estimatedMinutes: t.estimatedMinutes,
        tags: tagsByTaskId.get(t.id) ?? [],
    }))

    // === MÉTRICAS (dados reais, ver auditoria) ===

    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    function isInRange(date: Date | null, start: Date, end: Date) {
        if (!date) return false
        const d = new Date(date)
        return d >= start && d < end
    }

    const sessionsThisWeek = tasks.filter((t) =>
        isInRange(t.plannedDate, weekStart, weekEnd)
    ).length

    const sessionsLastWeek = tasks.filter((t) =>
        isInRange(t.plannedDate, lastWeekStart, weekStart)
    ).length

    const sessionsDelta = sessionsThisWeek - sessionsLastWeek

    // Estimado, não realizado — o schema só tem estimatedMinutes.
    // Conta apenas o que foi de fato concluído nesta semana.
    const estimatedMinutesThisWeek = tasks
        .filter(
            (t) =>
                t.status === 'DONE' &&
                isInRange(t.completedAt, weekStart, weekEnd)
        )
        .reduce((total, t) => total + (t.estimatedMinutes ?? 0), 0)

    const estimatedHours = Math.floor(estimatedMinutesThisWeek / 60)
    const estimatedRestMinutes = estimatedMinutesThisWeek % 60

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="mx-auto max-w-360 px-4 py-6 sm:px-6 sm:py-8">

                {/* CABEÇALHO */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <GraduationCap className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Estudos
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Aprenda com consistência, clareza e menos sobrecarga.
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-slate-600">
                            Organize suas matérias, mantenha o foco e celebre cada pequeno progresso. ✨
                        </p>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-3">
                        <div className="hidden max-w-47.5 rounded-xl bg-blue-50 px-4 py-3 text-blue-600 xl:block">
                            <p className="text-sm italic">
                                &ldquo;Conhecimento hoje, mais oportunidades amanhã.&rdquo;
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Sessões da semana</p>
                            <p className="text-xl font-bold text-slate-900">
                                {sessionsThisWeek}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                {sessionsDelta === 0
                                    ? 'igual à semana anterior'
                                    : sessionsDelta > 0
                                        ? `+${sessionsDelta} que a semana anterior`
                                        : `${sessionsDelta} que a semana anterior`}
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Metas ativas</p>
                            <p className="text-xl font-bold text-slate-900">—</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                sem metas por área ainda
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Horas estudadas (estimado)
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {estimatedMinutesThisWeek > 0
                                    ? `${estimatedHours}h ${estimatedRestMinutes}min`
                                    : '—'}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                concluídas esta semana
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONTROLES + VIEWS */}
                <StudyView tasks={tasksWithTags} availableTags={userTags} />

            </div>
        </div>
    )
}
