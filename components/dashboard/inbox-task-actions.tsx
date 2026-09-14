'use client'

import { useTransition } from 'react'

import { organizeInboxTask } from '@/app/(app)/inbox/_actions/organize-inbox-task'
import { Button } from '@/components/ui/button'

interface InboxTaskActionsProps {
    taskId: string
}

export function InboxTaskActions({
    taskId,
}: InboxTaskActionsProps) {
    const [isPending, startTransition] = useTransition()

    function moveTo(
        destination:
            | 'TODAY_WORK'
            | 'TODAY_STUDIES'
            | 'TODAY_PERSONAL'
            | 'WORK'
            | 'STUDIES'
            | 'PERSONAL'
    ) {
        startTransition(async () => {
            await organizeInboxTask(taskId, destination)
        })
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('TODAY_WORK')}
            >
                Hoje / Trabalho
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('TODAY_STUDIES')}
            >
                Hoje / Estudos
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('TODAY_PERSONAL')}
            >
                Hoje / Pessoal
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('WORK')}
            >
                Trabalho
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('STUDIES')}
            >
                Estudos
            </Button>

            <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => moveTo('PERSONAL')}
            >
                Pessoal
            </Button>
        </div>
    )
}