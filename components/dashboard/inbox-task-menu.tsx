"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteInboxTask } from "@/app/(dashboard)/inbox/actions";
import { EditInboxTaskModal } from "@/components/dashboard/edit-inbox-task-modal";

interface TagOption { id: string; name: string; color: string; }
interface Props {
    task: { id: string; title: string; description: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; plannedDate: Date | null; tags: TagOption[]; };
    availableTags: TagOption[];
}

export function InboxTaskMenu({ task, availableTags }: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleDelete() {
        startTransition(async () => {
            await deleteInboxTask(task.id);
            setDeleteOpen(false);
            setMenuOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <div className="relative">
                <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Ações da tarefa"><MoreVertical className="size-4" /></button>
                {menuOpen && (
                    <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                        <button type="button" onClick={() => { setEditOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil className="size-4" />Editar tarefa</button>
                        <button type="button" onClick={() => { setDeleteOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"><Trash2 className="size-4" />Excluir tarefa</button>
                    </div>
                )}
            </div>

            <EditInboxTaskModal open={editOpen} onClose={() => setEditOpen(false)} task={task} availableTags={availableTags} />

            {deleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900">Excluir tarefa?</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">A tarefa <strong>{task.title}</strong> será excluída.</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setDeleteOpen(false)} disabled={isPending} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                            <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{isPending && <Loader2 className="size-4 animate-spin" />}Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
