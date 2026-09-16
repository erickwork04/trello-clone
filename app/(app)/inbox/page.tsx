import { headers } from "next/headers";

import { and, asc, eq, inArray } from "drizzle-orm";
import {
    AlertCircle,
    Inbox,
    Search,
    SlidersHorizontal,
    Tag,
} from "lucide-react";

import { InboxStatCard } from "@/components/dashboard/inbox-stat-card";
import { NewInboxTaskButton } from "@/components/dashboard/new-inbox-task-button";
import { InboxBoard } from "@/components/dashboard/inbox-board";
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

    const total = inboxTasks.length;

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
                            value={total}
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
                            value={total}
                            description="aguardando revisão"
                        />
                    </div>
                </div>

                {/* TOOLBAR */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            className="rounded-lg bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600"
                        >
                            Quadro
                        </button>

                        <button
                            type="button"
                            className="px-5 py-2 text-sm text-slate-600 transition hover:text-slate-900"
                        >
                            Lista
                        </button>

                        <button
                            type="button"
                            className="px-5 py-2 text-sm text-slate-600 transition hover:text-slate-900"
                        >
                            Calendário
                        </button>
                    </div>

                    <div className="flex flex-1 flex-wrap justify-end gap-3">
                        <div className="flex h-11 w-full max-w-[320px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                            <Search className="size-4 shrink-0 text-slate-400" />

                            <input
                                type="text"
                                placeholder="Buscar na caixa de entrada..."
                                className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            type="button"
                            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            <SlidersHorizontal className="size-4" />
                            Filtros
                        </button>

                        <NewInboxTaskButton tags={userTags} />
                    </div>
                </div>

                {/* BOARD */}

                <InboxBoard
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

