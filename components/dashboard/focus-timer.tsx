'use client'

import { useEffect, useState, useTransition } from 'react'
import { Play, Square } from 'lucide-react'

import { startFocus } from '@/app/(app)/hoje/_actions/start-focus'
import { finishFocus } from '@/app/(app)/hoje/_actions/finish-focus'

interface FocusTimerProps {
    taskId: string

    activeSession?: {
        id: string
        taskId: string
        startedAt: string
    } | null
}

function formatSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function FocusTimer({
    taskId,
    activeSession,
}: FocusTimerProps) {
    const [sessionId, setSessionId] = useState<string | null>(
        activeSession?.taskId === taskId
            ? activeSession.id
            : null
    )

    const [startedAt, setStartedAt] = useState<Date | null>(
        activeSession?.taskId === taskId
            ? new Date(activeSession.startedAt)
            : null
    )

    const [elapsedSeconds, setElapsedSeconds] = useState(0)

    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!startedAt) {
            setElapsedSeconds(0)
            return
        }

        const startTime = startedAt.getTime()

        function updateTimer() {
            const seconds = Math.floor(
                (Date.now() - startTime) / 1000
            )

            setElapsedSeconds(seconds)
        }

        updateTimer()

        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [startedAt])

    function handleStart() {
        startTransition(async () => {
            const focus = await startFocus(taskId)

            if (!focus) {
                return
            }

            setSessionId(focus.id)
            setStartedAt(new Date(focus.startedAt))
        })
    }

    function handleFinish() {
        if (!sessionId) {
            return
        }

        startTransition(async () => {
            await finishFocus(sessionId)

            setSessionId(null)
            setStartedAt(null)
            setElapsedSeconds(0)

            window.location.reload()
        })
    }

    if (sessionId && startedAt) {
        return (
            <div className="flex items-center gap-3">
                <span className="`min-w-17.5 font-mono text-sm font-semibold text-blue-600">
                    {formatSeconds(elapsedSeconds)}
                </span>

                <button
                    type="button"
                    onClick={handleFinish}
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                    <Square className="size-4 fill-current" />

                    {isPending
                        ? 'Finalizando...'
                        : 'Finalizar'}
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
            <Play className="size-4 fill-current" />

            {isPending
                ? 'Iniciando...'
                : 'Iniciar foco'}
        </button>
    )
}