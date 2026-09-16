"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { createTag } from "@/app/(app)/tags/actions";

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

export function NewTagButton() {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [color, setColor] = useState(COLORS[0]);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        startTransition(async () => {
            await createTag({
                name: trimmedName,
                color,
            });

            setName("");
            setColor(COLORS[0]);
            setOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
                <Plus className="size-4" />
                Nova tag
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Criar nova tag
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Defina um nome e uma cor para identificar suas tarefas.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Nome
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ex.: Estudos"
                                    autoFocus
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
                                            onClick={() => setColor(item)}
                                            className={`size-9 rounded-full border-4 transition ${color === item
                                                ? "border-slate-900"
                                                : "border-transparent"
                                                }`}
                                            style={{ backgroundColor: item }}
                                            aria-label={`Selecionar cor ${item}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    disabled={isPending}
                                    className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={isPending || !name.trim()}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="size-4 animate-spin" />}
                                    Criar tag
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
