import { headers } from "next/headers";

import { and, asc, eq, inArray } from "drizzle-orm";
import {
    AlertCircle,
    Inbox,
    Tag,
} from "lucide-react";

import { InboxStatCard } from "@/components/dashboard/inbox-stat-card";
import { InboxView } from "@/components/dashboard/inbox-view";
import { db } from "@/db";
import { tag } from "@/db/schema/tag";
import { task } from "@/db/schema/task";
import { taskTag } from "@/db/schema/task-tag";
import { auth } from "@/lib/auth";

export default async function InboxPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return null;
    }

    const [inboxTasks, userTags] = await Promise.all([
        db
            .select()
            .from(task)
            .where(
                and(
                    eq(task.userId, session.user.id),
                    eq(task.area, "INBOX"),
                    eq(task.status, "BACKLOG")
                )
            )
            .orderBy(asc(task.position), asc(task.createdAt)),

        db
            .select()
            .from(tag)
            .where(eq(tag.userId, session.user.id))
            .orderBy(asc(tag.name)),
    ]);

    const taskIds = inboxTasks.map((item) => item.id);

    const taskTagRows =
        taskIds.length > 0
            ? await db
                .select({
                    taskId: taskTag.taskId,
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                })
                .from(taskTag)
                .innerJoin(tag, eq(taskTag.tagId, tag.id))
                .where(
                    and(
                        inArray(taskTag.taskId, taskIds),
                        eq(tag.userId, session.user.id)
                    )
                )
            : [];

    const tagsByTask = new Map<
        string,
        Array<{
            id: string;
            name: string;
            color: string;
        }>
    >();

    for (const row of taskTagRows) {
        const current = tagsByTask.get(row.taskId) ?? [];

        current.push({
            id: row.id,
            name: row.name,
            color: row.color,
        });

        tagsByTask.set(row.taskId, current);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const capturedToday = inboxTasks.filter(
        (item) => item.createdAt >= startOfToday
    ).length;

    const pendingToOrganize = inboxTasks.filter(
        (item) => item.inboxStage !== "ORGANIZED"
    ).length;

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="w-full px-8 py-6 2xl:px-10">
                {/* HEADER */}
                <div className="mb-6">
                    <div className="mb-5">
                        <div className="flex items-center gap-3">
                            <Inbox className="size-8 text-blue-600" />

                            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                                Caixa de Entrada
                            </h1>
                        </div>

                        <p className="mt-1 text-lg text-slate-600">
                            Capture suas ideias e tarefas rapidamente, sem pressão.
                        </p>

                        <p className="mt-3 max-w-2xl text-sm text-slate-500">
                            Tudo o que chega aqui pode ser organizado depois. O importante é
                            não esquecer. ✨
                        </p>
                    </div>

                    {/* FRASE + INDICADORES */}
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="flex min-h-25 items-center justify-center rounded-2xl bg-blue-50 px-5 py-4">
                            <p className="text-center text-sm italic leading-6 text-blue-600">
                                “Disciplina hoje,
                                <br />
                                mais liberdade amanhã.”
                            </p>
                        </div>

                        <InboxStatCard
                            icon={<Inbox className="size-5 text-blue-600" />}
                            title="Capturadas hoje"
                            value={capturedToday}
                            description="novos itens"
                        />

                        <InboxStatCard
                            icon={<Tag className="size-5 text-slate-600" />}
                            title="Sem categoria"
                            value={inboxTasks.filter(
                                (item) => (tagsByTask.get(item.id)?.length ?? 0) === 0
                            ).length}
                            description="precisam de categoria"
                        />

                        <InboxStatCard
                            icon={<AlertCircle className="size-5 text-rose-500" />}
                            title="Pendentes de organizar"
                            value={pendingToOrganize}
                            description="aguardando revisão"
                        />
                    </div>
                </div>

                {/* TOOLBAR + VIEWS + BUSCA + FILTROS */}
                <InboxView
                    tasks={inboxTasks.map((item) => ({
                        ...item,
                        tags: tagsByTask.get(item.id) ?? [],
                    }))}
                    availableTags={userTags}
                />

            </div>
        </div>
    );
}

