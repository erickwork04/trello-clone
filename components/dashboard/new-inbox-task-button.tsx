"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createInboxTask } from "@/app/(app)/inbox/_actions/inbox-crud";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface TagOption {
    id: string;
    name: string;
    color: string;
}

interface NewInboxTaskButtonProps {
    tags: TagOption[];
}

export function NewInboxTaskButton({
    tags,
}: NewInboxTaskButtonProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<
        "LOW" | "MEDIUM" | "HIGH"
    >("MEDIUM");
    const [plannedDate, setPlannedDate] = useState("");
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const router = useRouter();

    const selectedTags = useMemo(
        () => tags.filter((item) => selectedTagIds.includes(item.id)),
        [tags, selectedTagIds]
    );

    function toggleTag(tagId: string) {
        setSelectedTagIds((current) =>
            current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId]
        );
    }

    function resetForm() {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setPlannedDate("");
        setSelectedTagIds([]);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            return;
        }

        startTransition(async () => {
            const result = await createInboxTask({
                title,
                description,
                priority,
                plannedDate: plannedDate || undefined,
                tagIds: selectedTagIds,
            });

            if (result?.serverError) {
                toast.error(result.serverError);
                return;
            }

            resetForm();
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
                Nova captura
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Nova captura</DialogTitle>
                        <DialogDescription>
                            Capture agora. Organize depois.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Tarefa
                            </label>

                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="O que você quer lembrar?"
                                autoFocus
                                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Descrição
                                <span className="ml-1 font-normal text-slate-400">
                                    opcional
                                </span>
                            </label>

                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Adicione algum detalhe..."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Prioridade
                                </label>

                                <select
                                    value={priority}
                                    onChange={(event) =>
                                        setPriority(
                                            event.target.value as "LOW" | "MEDIUM" | "HIGH"
                                        )
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                                >
                                    <option value="LOW">Baixa</option>
                                    <option value="MEDIUM">Média</option>
                                    <option value="HIGH">Alta</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                    Data
                                    <span className="ml-1 font-normal text-slate-400">
                                        opcional
                                    </span>
                                </label>

                                <input
                                    type="date"
                                    value={plannedDate}
                                    onChange={(event) => setPlannedDate(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700">
                                    Tags
                                </label>

                                <span className="text-xs text-slate-400">
                                    {selectedTagIds.length} selecionada(s)
                                </span>
                            </div>

                            {tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((item) => {
                                        const selected = selectedTagIds.includes(item.id);

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleTag(item.id)}
                                                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected
                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                {item.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                                    Você ainda não criou tags.
                                </div>
                            )}

                            {selectedTags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedTags.map((item) => (
                                        <span
                                            key={item.id}
                                            className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                                            style={{ backgroundColor: item.color }}
                                        >
                                            {item.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
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
                                disabled={isPending || !title.trim()}
                                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPending && <Loader2 className="size-4 animate-spin" />}
                                Salvar captura
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
