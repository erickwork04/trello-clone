"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    deleteTag,
    updateTag,
} from "@/app/(app)/tags/actions";

const COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#d97706",
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#64748b",
];

interface TagActionsProps {
    tagId: string;
    name: string;
    color: string;
}

export function TagActions({
    tagId,
    name,
    color,
}: TagActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [tagName, setTagName] = useState(name);
    const [tagColor, setTagColor] = useState(color);

    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = tagName.trim();

        if (!trimmedName) {
            return;
        }

        startTransition(async () => {
            await updateTag({
                id: tagId,
                name: trimmedName,
                color: tagColor,
            });

            setEditOpen(false);
            router.refresh();
        });
    }

    function handleDelete() {
        startTransition(async () => {
            await deleteTag(tagId);

            setDeleteOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                    <Pencil className="size-4" />
                    Editar
                </button>

                <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                    <Trash2 className="size-4" />
                    Excluir
                </button>
            </div>

            {/* EDITAR */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Editar tag
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Altere o nome ou a cor da tag.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditOpen(false)}
                                className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Nome
                                </label>

                                <input
                                    type="text"
                                    value={tagName}
                                    onChange={(event) => setTagName(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-3 block text-sm font-medium text-slate-700">
                                    Cor
                                </label>

                                <div className="flex flex-wrap gap-3">
                                    {COLORS.map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setTagColor(item)}
                                            className={`size-9 rounded-full border-4 transition ${tagColor === item
                                                ? "border-slate-900"
                                                : "border-transparent"
                                                }`}
                                            style={{ backgroundColor: item }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTagName(name);
                                        setTagColor(color);
                                        setEditOpen(false);
                                    }}
                                    disabled={isPending}
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isPending || !tagName.trim()}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="size-4 animate-spin" />}
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EXCLUIR */}
            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Excluir tag?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    A tag <strong>{name}</strong> será removida. As tarefas
                                    continuarão existindo.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setDeleteOpen(false)}
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteOpen(false)}
                                disabled={isPending}
                                className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                Excluir tag
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
