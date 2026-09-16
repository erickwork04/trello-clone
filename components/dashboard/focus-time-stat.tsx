'use client'

import { useEffect, useState } from 'react'

interface FocusTimeStatProps {
    totalSeconds: number

    activeSession?: {
        startedAt: string
        pausedAt: string | null
        accumulatedSeconds: number
    } | null
}

function formatFocusTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    )
    const seconds = totalSeconds % 60

    if (hours > 0) {
        return `${hours}h ${minutes}min`
    }

    if (minutes > 0) {
        return `${minutes}min ${seconds}s`
    }

    return `${seconds}s`
}

export function FocusTimeStat({
    totalSeconds,
    activeSession,
}: FocusTimeStatProps) {
    const [currentTotal, setCurrentTotal] =
        useState(totalSeconds)

    useEffect(() => {
        if (!activeSession) {
            setCurrentTotal(totalSeconds)
            return
        }

        const session = activeSession

        if (session.pausedAt) {
            setCurrentTotal(
                totalSeconds +
                session.accumulatedSeconds
            )

            return
        }

        const startedAt = new Date(
            session.startedAt
        ).getTime()

        function updateTime() {
            const runningSeconds = Math.max(
                0,
                Math.floor(
                    (Date.now() - startedAt) / 1000
                )
            )

            setCurrentTotal(
                totalSeconds +
                session.accumulatedSeconds +
                runningSeconds
            )
        }

        updateTime()

        const interval = setInterval(
            updateTime,
            1000
        )

        return () => clearInterval(interval)
    }, [
        totalSeconds,
        activeSession,
    ])
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">
                Foco Total do Dia
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatFocusTime(currentTotal)}
            </p>
        </section>
    )
}