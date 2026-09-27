'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { completeTask } from '@/app/(app)/hoje/_actions/complete-task'
import { finishFocus } from '@/app/(app)/hoje/_actions/finish-focus'

interface FocusTaskCheckboxProps {
    taskId: string
    activeSessionId?: string | null
}

export function FocusTaskCheckbox({
    taskId,
    activeSessionId,
}: FocusTaskCheckboxProps) {
    const [isPending, startTransition] =
        useTransition()

    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function handleComplete() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            // Se estiver contando foco,
            // encerra a sessão primeiro.
            if (activeSessionId) {
                await finishFocus({ sessionId: activeSessionId })
            }

            await completeTask({ taskId, completed: false })

            // Concluir a tarefa em foco limpa a seleção (?focus=) —
            // volta ao estado vazio, sem escolher outra
            // automaticamente.
            const params = new URLSearchParams(searchParams.toString())
            params.delete('focus')
            const query = params.toString()
            router.replace(query ? `${pathname}?${query}` : pathname, {
                scroll: false,
            })
        })
    }

    return (
        <input
            type="checkbox"
            disabled={isPending}
            onChange={handleComplete}
            className="mt-1 size-5 shrink-0 rounded border-slate-300"
        />
    )
}