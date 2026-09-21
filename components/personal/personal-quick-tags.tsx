'use client'

import { useState } from 'react'

interface QuickTag {
    id: string
    name: string
    color: string
}

interface PersonalQuickTagsProps {
    tags: QuickTag[]
    selectedIds: string[]
    onToggle: (tagId: string) => void
}

const VISIBLE_LIMIT = 6

export function PersonalQuickTags({
    tags,
    selectedIds,
    onToggle,
}: PersonalQuickTagsProps) {
    const [expanded, setExpanded] = useState(false)

    if (tags.length === 0) return null

    const visibleTags = expanded ? tags : tags.slice(0, VISIBLE_LIMIT)
    const hiddenCount = tags.length - visibleTags.length

    return (
        <div className="flex flex-wrap items-center gap-2">
            {visibleTags.map((t) => {
                const active = selectedIds.includes(t.id)
                return (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => onToggle(t.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                    </button>
                )
            })}

            {!expanded && hiddenCount > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50"
                >
                    +{hiddenCount} mais
                </button>
            )}
        </div>
    )
}
