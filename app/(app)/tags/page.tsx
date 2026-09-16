import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { Tags } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tag } from "@/db/schema/tag";

import { TagActions } from "@/components/dashboard/tag-actions";
import { NewTagButton } from "@/components/dashboard/new-tag-button";

export default async function TagsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return null;
    }

    const tags = await db
        .select()
        .from(tag)
        .where(eq(tag.userId, session.user.id))
        .orderBy(asc(tag.name));

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="w-full px-8 py-6 2xl:px-10">
                {/* HEADER */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <Tags className="size-8 text-blue-600" />

                            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
                                Tags
                            </h1>
                        </div>

                        <p className="mt-1 text-lg text-slate-600">
                            Organize suas tarefas com etiquetas personalizadas.
                        </p>

                        <p className="mt-3 text-sm text-slate-500">
                            Crie tags para identificar áreas, assuntos e tipos de tarefa.
                        </p>
                    </div>

                    <NewTagButton />
                </div>

                {/* RESUMO */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium text-slate-500">
                            Total de tags
                        </p>

                        <p className="mt-1 text-3xl font-bold text-slate-950">
                            {tags.length}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            etiquetas disponíveis
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium text-slate-500">
                            Organização
                        </p>

                        <p className="mt-1 text-base font-semibold text-slate-900">
                            Use várias tags por tarefa
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Ex.: Estudos, Backend, Importante
                        </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-sm italic leading-6 text-blue-600">
                            “Organização simples deixa o que importa mais visível.”
                        </p>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="min-h-135 w-full rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {tags.length > 0 ? (
                        <div className="grid w-full gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {tags.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex min-h-30flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                className="size-4 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor: item.color,
                                                }}
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-base font-semibold text-slate-900">
                                                    {item.name}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tag personalizada
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-slate-100 pt-3">
                                        <TagActions
                                            tagId={item.id}
                                            name={item.name}
                                            color={item.color}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex min-h-135 flex-col items-center justify-center px-6 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-blue-50">
                                <Tags className="size-7 text-blue-600" />
                            </div>

                            <h2 className="mt-5 text-lg font-semibold text-slate-900">
                                Nenhuma tag criada
                            </h2>

                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                Crie sua primeira tag para começar a identificar e organizar
                                melhor suas tarefas.
                            </p>

                            <div className="mt-6">
                                <NewTagButton />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
