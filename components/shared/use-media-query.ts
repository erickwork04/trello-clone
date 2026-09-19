'use client'

import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)'

function subscribe(callback: () => void) {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
    mediaQuery.addEventListener('change', callback)
    return () => mediaQuery.removeEventListener('change', callback)
}

function getSnapshot() {
    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
}

/**
 * Servidor (e primeira pintura no cliente, antes de hidratar) sempre
 * assume desktop — bate com o HTML do servidor e evita hydration
 * mismatch. `useSyncExternalStore` é a forma recomendada pelo React
 * de ler um valor "só existe no cliente" sem o anti-padrão de
 * `setState` dentro de `useEffect`.
 */
function getServerSnapshot() {
    return false
}

/**
 * Detecta se a viewport atual é mobile (<768px, mesmo breakpoint `md`
 * do Tailwind usado no resto do projeto).
 */
export function useIsMobile() {
    const isMobile = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    )

    // "mounted" continua útil pra quem precisa saber se já passou da
    // primeira pintura (ex.: para não aplicar a correção de view antes
    // da hidratação). Deriva do mesmo store: no servidor/primeira
    // pintura sempre há uma leitura pendente; usamos um segundo
    // useSyncExternalStore fixo em `true` só depois do primeiro commit
    // no cliente não é necessário — quem consome isMobile já trata
    // "false" como o estado inicial seguro.
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    )

    return { isMobile, mounted }
}
