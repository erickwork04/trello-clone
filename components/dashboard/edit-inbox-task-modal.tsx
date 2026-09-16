"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateInboxTask } from "@/app/(dashboard)/inbox/actions";

interface TagOption { id: string; name: string; color: string; }
interface Props {
    open: boolean;
    onClose: () => void;
    task: { id: string; title: string; description: string | null; priority: "LOW" | "MEDIUM" | "HIGH"; plannedDate: Date | null; tags: TagOption[]; };
    availableTags: TagOption[];
}

export function EditInboxTaskModal({ open, onClose, task, availableTags }: Props) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? "");
    const [priority, setPriority] = useState(task.priority);
    const [plannedDate, setPlannedDate] = useState(task.plannedDate ? task.plannedDate.toISOString().slice(0, 10) : "");
    const [selectedTagIds, setSelectedTagIds] = useState(task.tags.map((item) => item.id));
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const selectedTags = useMemo(() => availableTags.filter((item) => selectedTagIds.includes(item.id)), [availableTags, selectedTagIds]);
    if (!open) return null;

    function toggleTag(tagId: string) {
        setSelectedTagIds((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) return;

        startTransition(async () => {
            await updateInboxTask({ taskId: task.id, title, description, priority, plannedDate: plannedDate || undefined, tagIds: selectedTagIds });
            onClose();
            router.refresh();
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Editar tarefa</h2>
                        <p className="mt-1 text-sm text-slate-500">Atualize as informações da sua captura.</p>
                    </div>
                    <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"><X className="size-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Tarefa</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Descrição</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Prioridade</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none">
                                <option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Data</label>
                            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none" />
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium text-slate-700">Tags</label><span className="text-xs text-slate-400">{selectedTagIds.length} selecionada(s)</span></div>
                        {availableTags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((item) => {
                                    const selected = selectedTagIds.includes(item.id);
                                    return <button key={item.id} type="button" onClick={() => toggleTag(item.id)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</button>;
                                })}
                            </div>
                        ) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">Você ainda não criou tags.</div>}

                        {selectedTags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{selectedTags.map((item) => <span key={item.id} className="rounded-md px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: item.color }}>{item.name}</span>)}</div>}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button type="button" onClick={onClose} disabled={isPending} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={isPending || !title.trim()} className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{isPending && <Loader2 className="size-4 animate-spin" />}Salvar alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
