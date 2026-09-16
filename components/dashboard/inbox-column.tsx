import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

interface InboxColumnProps {
    title: string;
    description: string;
    count: number;
    color: string;
    children: ReactNode;
}

export function InboxColumn({
    title,
    description,
    count,
    color,
    children,
}: InboxColumnProps) {
    return (
        <div className="flex min-h-155 w-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50/40 p-3">
            <div className="mb-4 px-1">
                <div className="flex items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                            className={`size-5 shrink-0 rounded-full ${color}`}
                        />

                        <h2 className="truncate text-base font-semibold text-slate-950">
                            {title}
                        </h2>

                        <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {count}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                    >
                        <MoreHorizontal className="size-4" />
                    </button>
                </div>

                <p className="ml-7 mt-1 text-xs text-slate-500">
                    {description}
                </p>
            </div>

            <div className="flex flex-1 flex-col gap-3">
                {children}
            </div>
        </div>
    );
}