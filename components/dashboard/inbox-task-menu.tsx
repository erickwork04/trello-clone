"use client";

import { useState, useTransition } from "react";
import { Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteInboxTask } from "@/app/(app)/inbox/_actions/inbox-crud";
import { EditInboxTaskModal } from "@/components/dashboard/edit-inbox-task-modal";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
            const result = await deleteInboxTask({ taskId: task.id });

            if (result?.serverError) {
                toast.error(result.serverError);
                return;
            }

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

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A tarefa <strong>{task.title}</strong> será excluída.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
