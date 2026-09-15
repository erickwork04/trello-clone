interface FocusTimeStatProps {
    totalSeconds: number
}

function formatFocusTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600)

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    )

    if (hours > 0) {
        return `${hours}h ${minutes}min`
    }

    if (minutes > 0) {
        return `${minutes}min`
    }

    return '0min'
}

export function FocusTimeStat({
    totalSeconds,
}: FocusTimeStatProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
                Tempo de foco
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatFocusTime(totalSeconds)}
            </p>
        </section>
    )
}