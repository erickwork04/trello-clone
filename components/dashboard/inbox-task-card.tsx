import {
    CalendarDays,
    Clock3,
} from "lucide-react";

import { InboxTaskMenu } from "@/components/dashboard/inbox-task-menu";
import { CompleteInboxTaskButton } from "@/components/dashboard/complete-inbox-task-button";

interface TaskTag {
    id: string;
    name: string;
    color: string;
}

interface InboxTaskCardProps {
    taskId: string;
    title: string;
    description?: string | null;
    createdAt: Date;
    plannedDate?: Date | null;
    completedAt?: Date | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    tags?: TaskTag[];
    availableTags: TaskTag[];
}

export function InboxTaskCard({
    taskId,
    title,
    description,
    createdAt,
    plannedDate,
    completedAt,
    priority,
    tags = [],
    availableTags,
}: InboxTaskCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">

            <div className="flex items-start gap-3">

                {/* CHECKBOX */}
                <CompleteInboxTaskButton taskId={taskId} />

                {/* TÍTULO */}
                <p
                    className={`min-w-0 flex-1 text-sm font-medium leading-5 ${completedAt
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                        }`}
                >
                    {title}
                </p>

                {/* MENU */}
                <InboxTaskMenu
                    task={{
                        id: taskId,
                        title,
                        description: description ?? null,
                        priority,
                        plannedDate: plannedDate ?? null,
                        tags,
                    }}
                    availableTags={availableTags}
                />

            </div>

            {/* DESCRIÇÃO */}
            {description && (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                    {description}
                </p>
            )}

            {/* TAGS */}
            {tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <span
                            key={tag.id}
                            className="inline-flex w-fit items-center rounded-md px-2.5 py-1 text-xs font-medium"
                            style={{
                                backgroundColor: `${tag.color}18`,
                                color: tag.color,
                            }}
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            )}

            {/* DATA */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                {plannedDate ? (
                    <>
                        <CalendarDays className="size-3.5" />

                        <span>
                            {plannedDate.toLocaleDateString(
                                "pt-BR",
                                {
                                    day: "2-digit",
                                    month: "short",
                                }
                            )}
                        </span>
                    </>
                ) : (
                    <>
                        <Clock3 className="size-3.5" />

                        <span>
                            {createdAt.toLocaleDateString("pt-BR")}
                        </span>
                    </>
                )}
            </div>

        </div>
    );
}