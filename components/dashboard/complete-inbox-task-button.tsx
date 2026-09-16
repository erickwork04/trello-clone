"use client"

import { useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { completeInboxTask } from "@/app/(dashboard)/inbox/actions"

interface CompleteInboxTaskButtonProps {
    taskId: string
}

export function CompleteInboxTaskButton({
    taskId,
}: CompleteInboxTaskButtonProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    function handleComplete() {
        startTransition(async () => {
            await completeInboxTask(taskId)
            router.refresh()
        })
    }

    return (
        <button
            type="button"
            onClick={handleComplete}
            disabled={isPending}
            className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-[5px] border-2 border-slate-300 bg-white transition hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
            aria-label="Concluir tarefa"
        >
            {isPending ? (
                <Loader2 className="size-3 animate-spin text-blue-600" />
            ) : (
                <Check className="size-3 text-transparent transition hover:text-blue-600" />
            )}
        </button>
    )
}