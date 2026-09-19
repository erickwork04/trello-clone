'use client'

export type BoardViewMode = 'board' | 'list' | 'calendar'

interface ViewSwitcherProps {
    view: BoardViewMode
    onChange: (view: BoardViewMode) => void
    isMobile: boolean
}

/**
 * Alterna entre Quadro / Lista / Calendário.
 *
 * No mobile, "Quadro" não é exibido (o Kanban horizontal não faz
 * sentido em telas estreitas) — só Lista e Calendário aparecem, e
 * Lista é o padrão. A troca de view é responsabilidade de quem chama
 * (via `onChange`), tipicamente atualizando `?view=` na URL.
 */
export function ViewSwitcher({ view, onChange, isMobile }: ViewSwitcherProps) {
    const options: Array<{ value: BoardViewMode; label: string }> = isMobile
        ? [
            { value: 'list', label: 'Lista' },
            { value: 'calendar', label: 'Calendário' },
        ]
        : [
            { value: 'board', label: 'Quadro' },
            { value: 'list', label: 'Lista' },
            { value: 'calendar', label: 'Calendário' },
        ]

    return (
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    aria-pressed={view === option.value}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        view === option.value
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
