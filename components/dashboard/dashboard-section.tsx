import { ReactNode } from 'react'

interface DashboardSectionProps {
    icon: ReactNode
    title: string
    description?: string
    action?: ReactNode
    children: ReactNode
    className?: string
}

export function DashboardSection({
    icon,
    title,
    description,
    action,
    children,
    className = '',
}: DashboardSectionProps) {
    return (
        <section
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {icon}

                    <div>
                        <h2 className="font-semibold text-slate-900">
                            {title}
                        </h2>

                        {description && (
                            <p className="text-sm text-slate-500">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {action}
            </div>

            {children}
        </section>
    )
}