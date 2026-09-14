interface StatCardProps {
    label: string
    value: string
}

export function StatCard({
    label,
    value,
}: StatCardProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
                {value}
            </p>
        </section>
    )
}