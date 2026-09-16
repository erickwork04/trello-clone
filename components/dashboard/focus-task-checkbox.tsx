'use client'

import { useTransition } from 'react'

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

    function handleComplete() {
        if (isPending) {
            return
        }

        startTransition(async () => {
            // Se estiver contando foco,
            // encerra a sessão primeiro.
            if (activeSessionId) {
                await finishFocus(activeSessionId)
            }

            await completeTask(taskId, false)
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