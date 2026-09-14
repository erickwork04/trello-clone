interface AreaBadgeProps {
    area: 'Trabalho' | 'Estudos' | 'Pessoal'
}

export function AreaBadge({ area }: AreaBadgeProps) {
    const styles = {
        Trabalho: 'bg-blue-50 text-blue-700',
        Estudos: 'bg-violet-50 text-violet-700',
        Pessoal: 'bg-emerald-50 text-emerald-700',
    }

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[area]}`}
        >
            {area}
        </span>
    )
}