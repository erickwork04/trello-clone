import { ReactNode } from "react";

interface InboxStatCardProps {
    icon: ReactNode;
    title: string;
    value: number;
    description: string;
}

export function InboxStatCard({
    icon,
    title,
    value,
    description,
}: InboxStatCardProps) {
    return (
        <div className="flex min-h-25 min-w-41.25 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-50">
                {icon}
            </div>

            <div>
                <p className="text-xs font-medium text-slate-500">
                    {title}
                </p>

                <p className="mt-0.5 text-2xl font-bold text-slate-950">
                    {value}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">
                    {description}
                </p>
            </div>
        </div>
    );
}