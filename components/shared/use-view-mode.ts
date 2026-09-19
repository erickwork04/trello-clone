'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useIsMobile } from './use-media-query'
import type { BoardViewMode } from './view-switcher'

const VALID_VIEWS: BoardViewMode[] = ['board', 'list', 'calendar']

/**
 * Resolve e atualiza a view ativa (`board` | `list` | `calendar`) via
 * `?view=` na URL, com defaults diferentes por dispositivo:
 *
 * - Desktop sem parâmetro → `board`.
 * - Mobile sem parâmetro → `list`.
 * - Mobile recebendo `?view=board` → tratado como `list` (o Kanban
 *   horizontal nunca é exibido no mobile).
 *
 * Usa `router.replace` (não `push`) para não empilhar entradas de
 * histórico a cada troca de aba.
 */
export function useViewMode() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { isMobile, mounted } = useIsMobile()

    const rawView = searchParams.get('view')

    const isValidView = (value: string | null): value is BoardViewMode =>
        value !== null && VALID_VIEWS.includes(value as BoardViewMode)

    let view: BoardViewMode = isValidView(rawView)
        ? rawView
        : isMobile
            ? 'list'
            : 'board'

    // Antes de montar, `isMobile` é sempre `false` (SSR-safe) — então
    // o servidor e a primeira renderização do cliente concordam. Após
    // montar, se for mobile e a view resolvida for `board`, força `list`.
    if (mounted && isMobile && view === 'board') {
        view = 'list'
    }

    const setView = useCallback(
        (next: BoardViewMode) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('view', next)
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            })
        },
        [pathname, router, searchParams]
    )

    return { view, setView, isMobile, mounted }
}
