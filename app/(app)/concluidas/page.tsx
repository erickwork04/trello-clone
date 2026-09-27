import { headers } from 'next/headers'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { CircleCheckBig } from 'lucide-react'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { taskTag } from '@/db/schema/task-tag'
import { tag } from '@/db/schema/tag'
import { ConcludedView } from '@/components/concluded/concluded-view'
import type { ConcludedTask } from '@/components/concluded/concluded-task-card'

const AREA_MAP = {
    WORK: 'Trabalho',
    STUDIES: 'Estudos',
    PERSONAL: 'Pessoal',
    INBOX: 'Pessoal',
} as const

export default async function ConcluidasPage() {
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
                eq(task.status, 'DONE')
            )
        )
        // Mais recentemente concluídas primeiro. completedAt pode ser
        // nulo (tarefa marcada DONE sem essa data registrada) — essas
        // ficam por último, não inventamos uma data pra elas.
        .orderBy(
            sql`${task.completedAt} DESC NULLS LAST`,
            desc(task.updatedAt)
        )

    const taskIds = tasks.map((t) => t.id)

    const [taskTagRows] = await Promise.all([
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

    const concludedTasks: ConcludedTask[] = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        area: AREA_MAP[t.area],
        priority: t.priority,
        completedAt: t.completedAt,
        tags: tagsByTaskId.get(t.id) ?? [],
    }))

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <CircleCheckBig className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Concluídas
                        </h1>
                        <p className="text-sm text-slate-500">
                            Tarefas finalizadas recentemente.
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <ConcludedView tasks={concludedTasks} />
                </div>
            </div>
        </div>
    )
}
