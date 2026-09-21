import { headers } from 'next/headers'
import { and, asc, count, eq, inArray, ne } from 'drizzle-orm'
import { User } from 'lucide-react'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { taskTag } from '@/db/schema/task-tag'
import { tag } from '@/db/schema/tag'
import { PersonalView } from '@/components/personal/personal-view'

export default async function PessoalPage() {
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
                eq(task.area, 'PERSONAL'),
                ne(task.status, 'CANCELED')
            )
        )
        .orderBy(asc(task.position), asc(task.createdAt))

    const taskIds = tasks.map((t) => t.id)

    const [userTags, taskTagRows, usageRows] = await Promise.all([
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

        // Uso global (todas as áreas) — a tag não tem escopo, então
        // "quantas tarefas usam essa tag" só pode ser respondido de
        // forma honesta contando em todo o app, não só em Pessoal.
        db
            .select({
                tagId: taskTag.tagId,
                usageCount: count(taskTag.taskId),
            })
            .from(taskTag)
            .innerJoin(task, eq(taskTag.taskId, task.id))
            .where(eq(task.userId, session.user.id))
            .groupBy(taskTag.tagId),
    ])

    const usageByTagId = new Map(
        usageRows.map((row) => [row.tagId, row.usageCount])
    )

    const allTagsWithUsage = userTags.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
        usageCount: usageByTagId.get(t.id) ?? 0,
    }))

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
        tags: tagsByTaskId.get(t.id) ?? [],
    }))

    // === MÉTRICAS (dados reais, ver auditoria) ===

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const in7Days = new Date(today)
    in7Days.setDate(in7Days.getDate() + 7)

    function isInRange(date: Date | null, start: Date, end: Date) {
        if (!date) return false
        const d = new Date(date)
        return d >= start && d < end
    }

    // "Compromissos da semana": tarefas pessoais planejadas nos
    // próximos 7 dias (janela corrida a partir de hoje, não semana
    // de calendário).
    const commitmentsNext7Days = tasks.filter((t) =>
        isInRange(t.plannedDate, today, in7Days)
    ).length

    // "Pendências pessoais": não concluídas E (prioridade alta OU
    // data planejada já vencida). Regra objetiva com campos que já
    // existem (priority, plannedDate, status).
    const personalPending = tasks.filter((t) => {
        if (t.status === 'DONE') return false

        const isHighPriority = t.priority === 'HIGH'

        const isOverdue =
            t.plannedDate !== null && new Date(t.plannedDate) < today

        return isHighPriority || isOverdue
    }).length

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="mx-auto max-w-360 px-4 py-6 sm:px-6 sm:py-8">

                {/* CABEÇALHO */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <User className="size-5" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Pessoal
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Cuide da sua vida com leveza, equilíbrio e intenção.
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-xs text-slate-600">
                            Organize sua rotina, cuide do seu bem-estar e mantenha o foco no que realmente importa. ✨
                        </p>
                    </div>

                    <div className="flex flex-wrap items-stretch gap-3">
                        <div className="hidden max-w-47.5 rounded-xl bg-blue-50 px-4 py-3 text-blue-600 xl:block">
                            <p className="text-sm italic">
                                &ldquo;Uma vida mais leve também é uma vida produtiva.&rdquo;
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">Hábitos ativos</p>
                            <p className="text-xl font-bold text-slate-900">—</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                sem hábitos vinculados à área Pessoal
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Compromissos da semana
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {commitmentsNext7Days}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                nos próximos 7 dias
                            </p>
                        </div>

                        <div className="min-w-37.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs text-slate-500">
                                Pendências pessoais
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {personalPending}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                precisam de atenção
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONTROLES + VIEWS */}
                <PersonalView
                    tasks={tasksWithTags}
                    availableTags={userTags}
                    allTagsWithUsage={allTagsWithUsage}
                />

            </div>
        </div>
    )
}
