"use client"

import { useEffect, useState, useTransition } from "react"
import { moveInboxTask } from "@/app/(dashboard)/inbox/actions"
import { InboxColumn } from "@/components/dashboard/inbox-column"
import { InboxTaskCard } from "@/components/dashboard/inbox-task-card"

type InboxStage =
    | "ARRIVED"
    | "ORGANIZE"
    | "NEXT"
    | "ORGANIZED"

interface TaskTag {
    id: string
    name: string
    color: string
}

interface InboxTask {
    id: string
    title: string
    description: string | null
    createdAt: Date
    plannedDate: Date | null
    completedAt: Date | null
    priority: "LOW" | "MEDIUM" | "HIGH"
    inboxStage: InboxStage
    tags: TaskTag[]
}

interface InboxBoardProps {
    tasks: InboxTask[]
    availableTags: TaskTag[]
}

export function InboxBoard({
    tasks,
    availableTags,
}: InboxBoardProps) {
    const [items, setItems] = useState(tasks)
    const [, startTransition] = useTransition()

    useEffect(() => {
        setItems(tasks)
    }, [tasks])

    function handleDragStart(
        event: React.DragEvent<HTMLDivElement>,
        taskId: string
    ) {
        event.dataTransfer.setData("taskId", taskId)
        event.dataTransfer.effectAllowed = "move"
    }

    function handleDrop(
        event: React.DragEvent<HTMLDivElement>,
        stage: InboxStage
    ) {
        event.preventDefault()

        const taskId = event.dataTransfer.getData("taskId")

        if (!taskId) {
            return
        }

        setItems((current) =>
            current.map((item) =>
                item.id === taskId
                    ? {
                        ...item,
                        inboxStage: stage,
                    }
                    : item
            )
        )

        startTransition(async () => {
            await moveInboxTask(taskId, stage)
        })
    }

    function tasksByStage(stage: InboxStage) {
        return items.filter((item) => item.inboxStage === stage)
    }

    return (
        <div className="grid w-full min-h-155 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <DropColumn
                stage="ARRIVED"
                title="Chegou agora"
                description="Itens recém-capturados."
                color="bg-blue-500"
                tasks={tasksByStage("ARRIVED")}
                availableTags={availableTags}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />

            <DropColumn
                stage="ORGANIZE"
                title="Para organizar"
                description="Defina categoria, projeto e prioridade."
                color="bg-amber-400"
                tasks={tasksByStage("ORGANIZE")}
                availableTags={availableTags}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />

            <DropColumn
                stage="NEXT"
                title="Próximos passos"
                description="Transforme em ações concretas."
                color="bg-emerald-500"
                tasks={tasksByStage("NEXT")}
                availableTags={availableTags}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />

            <DropColumn
                stage="ORGANIZED"
                title="Organizada"
                description="Itens já direcionados para projetos."
                color="bg-slate-400"
                tasks={tasksByStage("ORGANIZED")}
                availableTags={availableTags}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
            />

        </div>
    )
}

interface DropColumnProps {
    stage: InboxStage
    title: string
    description: string
    color: string
    tasks: InboxTask[]
    availableTags: TaskTag[]
    onDragStart: (
        event: React.DragEvent<HTMLDivElement>,
        taskId: string
    ) => void
    onDrop: (
        event: React.DragEvent<HTMLDivElement>,
        stage: InboxStage
    ) => void
}

function DropColumn({
    stage,
    title,
    description,
    color,
    tasks,
    availableTags,
    onDragStart,
    onDrop,
}: DropColumnProps) {
    return (
        <div
            className="w-full min-w-0"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onDrop(event, stage)}
        >
            <InboxColumn
                title={title}
                description={description}
                count={tasks.length}
                color={color}
            >
                {tasks.map((item) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(event) =>
                            onDragStart(event, item.id)
                        }
                    >
                        <InboxTaskCard
                            taskId={item.id}
                            title={item.title}
                            description={item.description}
                            createdAt={item.createdAt}
                            plannedDate={item.plannedDate}
                            completedAt={item.completedAt}
                            priority={item.priority}
                            tags={item.tags}
                            availableTags={availableTags}
                        />
                    </div>
                ))}
            </InboxColumn>
        </div>
    )
}