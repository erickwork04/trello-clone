'use client'

import { useEffect, useState, useTransition } from 'react'

import { Pause, Play, Square } from 'lucide-react'

import { startFocus } from '@/app/(app)/hoje/_actions/start-focus'
import { finishFocus } from '@/app/(app)/hoje/_actions/finish-focus'
import { pauseFocus } from '@/app/(app)/hoje/_actions/pause-focus'
import { resumeFocus } from '@/app/(app)/hoje/_actions/resume-focus'

interface FocusTimerProps {
    taskId: string

    activeSession?: {
        id: string
        taskId: string
        startedAt: string
        pausedAt: string | null
        accumulatedSeconds: number
    } | null
}

function formatSeconds(seconds: number) {
    const hours = Math.floor(seconds / 3600)

    const minutes = Math.floor(
        (seconds % 3600) / 60
    )

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
    const hasActiveSession =
        activeSession?.taskId === taskId

    const [sessionId, setSessionId] =
        useState<string | null>(
            hasActiveSession
                ? activeSession.id
                : null
        )

    const [startedAt, setStartedAt] =
        useState<Date | null>(
            hasActiveSession
                ? new Date(activeSession.startedAt)
                : null
        )

    const [paused, setPaused] =
        useState(
            hasActiveSession
                ? Boolean(activeSession.pausedAt)
                : false
        )

    const [accumulatedSeconds, setAccumulatedSeconds] =
        useState(
            hasActiveSession
                ? activeSession.accumulatedSeconds
                : 0
        )

    const [elapsedSeconds, setElapsedSeconds] =
        useState(
            hasActiveSession
                ? activeSession.accumulatedSeconds
                : 0
        )

    const [isPending, startTransition] =
        useTransition()

    useEffect(() => {
        if (!sessionId) {
            setElapsedSeconds(0)
            return
        }

        if (paused || !startedAt) {
            setElapsedSeconds(accumulatedSeconds)
            return
        }

        const startTime = startedAt.getTime()

        function updateTimer() {
            const currentSeconds = Math.max(
                0,
                Math.floor(
                    (Date.now() - startTime) / 1000
                )
            )

            setElapsedSeconds(
                accumulatedSeconds + currentSeconds
            )
        }

        updateTimer()

        const interval = setInterval(
            updateTimer,
            1000
        )

        return () => clearInterval(interval)
    }, [
        sessionId,
        startedAt,
        paused,
        accumulatedSeconds,
    ])

    function handleStart() {
        startTransition(async () => {
            const focus = await startFocus(taskId)

            if (!focus) {
                return
            }

            setSessionId(focus.id)
            setStartedAt(
                new Date(focus.startedAt)
            )

            setAccumulatedSeconds(
                focus.accumulatedSeconds ?? 0
            )

            setPaused(
                Boolean(focus.pausedAt)
            )
        })
    }

    function handlePause() {
        if (!sessionId || paused) {
            return
        }

        startTransition(async () => {
            await pauseFocus(sessionId)

            setAccumulatedSeconds(
                elapsedSeconds
            )

            setPaused(true)
        })
    }

    function handleResume() {
        if (!sessionId || !paused) {
            return
        }

        startTransition(async () => {
            await resumeFocus(sessionId)

            setStartedAt(new Date())
            setPaused(false)
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
            setPaused(false)
            setAccumulatedSeconds(0)
            setElapsedSeconds(0)
        })
    }

    if (sessionId) {
        return (
            <div className="flex flex-wrap items-center gap-3">

                <span className="min-w-17.5font-mono text-sm font-semibold text-blue-600">
                    {formatSeconds(
                        elapsedSeconds
                    )}
                </span>

                {paused ? (
                    <button
                        type="button"
                        onClick={handleResume}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Play className="size-4 fill-current" />

                        {isPending
                            ? 'Continuando...'
                            : 'Continuar'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handlePause}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                        <Pause className="size-4 fill-current" />

                        {isPending
                            ? 'Pausando...'
                            : 'Pausar'}
                    </button>
                )}

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