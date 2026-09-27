"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    deleteTag,
    updateTag,
} from "@/app/(app)/tags/actions";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
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
            const result = await updateTag({
                id: tagId,
                name: trimmedName,
                color: tagColor,
            });

            if (result?.serverError) {
                toast.error(result.serverError);
                return;
            }

            setEditOpen(false);
            router.refresh();
        });
    }

    function handleDelete() {
        startTransition(async () => {
            const result = await deleteTag({ id: tagId });

            if (result?.serverError) {
                toast.error(result.serverError);
                return;
            }

            setDeleteOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <div className="flex flex-wrap items-center justify-end gap-2">
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
            <Dialog
                open={editOpen}
                onOpenChange={(open) => {
                    setEditOpen(open);
                    if (!open) {
                        setTagName(name);
                        setTagColor(color);
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar tag</DialogTitle>
                        <DialogDescription>
                            Altere o nome ou a cor da tag.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Nome
                            </label>

                            <input
                                type="text"
                                value={tagName}
                                onChange={(event) => setTagName(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
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

                        <DialogFooter>
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
                                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                Salvar
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EXCLUIR */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                            A tag <strong>{name}</strong> será removida. As tarefas
                            continuarão existindo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            {isPending && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Excluir tag
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
