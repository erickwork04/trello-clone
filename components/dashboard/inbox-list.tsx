'use client'

import { InboxTaskCard } from '@/components/dashboard/inbox-task-card'

type InboxStage = 'ARRIVED' | 'ORGANIZE' | 'NEXT' | 'ORGANIZED'

const STAGE_LABELS: Record<InboxStage, string> = {
    ARRIVED: 'Chegou agora',
    ORGANIZE: 'Para organizar',
    NEXT: 'Próximos passos',
    ORGANIZED: 'Organizada',
}

interface TaskTag {
    id: string
    name: string
    color: string
}

interface InboxListTask {
    id: string
    title: string
    description: string | null
    createdAt: Date
    plannedDate: Date | null
    completedAt: Date | null
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    inboxStage: InboxStage
    tags: TaskTag[]
}

interface InboxListProps {
    tasks: InboxListTask[]
    availableTags: TaskTag[]
}

export function InboxList({ tasks, availableTags }: InboxListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex min-h-40 items-center justify-center">
                <p className="text-sm text-slate-400">
                    Nenhum item encontrado.
                </p>
            </div>
        )
    }

    return (
        <div className="flex w-full flex-col gap-3">
            {tasks.map((item) => (
                <InboxTaskCard
                    key={item.id}
                    taskId={item.id}
                    title={item.title}
                    description={item.description}
                    createdAt={item.createdAt}
                    plannedDate={item.plannedDate}
                    completedAt={item.completedAt}
                    priority={item.priority}
                    tags={item.tags}
                    availableTags={availableTags}
                    stageLabel={STAGE_LABELS[item.inboxStage]}
                />
            ))}
        </div>
    )
}
