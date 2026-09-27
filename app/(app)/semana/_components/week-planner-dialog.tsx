'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createWeekPlan } from '../_actions/create-week-plan'
import {
    Plus,
    Target,
    Sprout,
    X,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'

interface WeekPlannerDialogProps {
    weekLabel: string
    weekStart: string

    initialGoals: {
        id: string
        title: string
    }[]

    initialHabits: {
        id: string
        title: string
        targetDays: number
    }[]
}


export function WeekPlannerDialog({
    weekLabel,
    weekStart,
    initialGoals,
    initialHabits,
}: WeekPlannerDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [goals, setGoals] = useState<string[]>(
        initialGoals.length > 0
            ? initialGoals.map((goal) => goal.title)
            : [''],
    )

    const [habits, setHabits] = useState(
        initialHabits.length > 0
            ? initialHabits.map((habit) => ({
                title: habit.title,
                targetDays: habit.targetDays,
            }))
            : [
                {
                    title: '',
                    targetDays: 7,
                },
            ],
    )

    function handleSave() {
        startTransition(async () => {
            const result = await createWeekPlan({
                weekStart,
                goals,
                habits: habits
                    .filter(
                        (habit) =>
                            habit.title.trim(),
                    )
                    .map((habit) => ({
                        title: habit.title,
                        targetDays:
                            habit.targetDays,
                    })),
            })

            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }

            setOpen(false)
        })
    }

    function addGoal() {
        setGoals((current) => [
            ...current,
            '',
        ])
    }

    function removeGoal(index: number) {
        setGoals((current) =>
            current.filter(
                (_, goalIndex) =>
                    goalIndex !== index,
            ),
        )
    }

    function addHabit() {
        setHabits((current) => [
            ...current,
            {
                title: '',
                targetDays: 7,
                enabled: true,
            },
        ])
    }

    function removeHabit(index: number) {
        setHabits((current) =>
            current.filter(
                (_, habitIndex) =>
                    habitIndex !== index,
            ),
        )
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-14.5 items-center justify-center gap-3 rounded-xl bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
                <Plus className="size-5" />
                Planejar semana
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#071958]">
                            Planejar minha semana
                        </DialogTitle>
                        <DialogDescription>{weekLabel}</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-8">
                        {/* OBJETIVOS */}
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white">
                                    <Target className="size-5" />
                                </div>

                                <div>
                                    <h3 className="font-bold text-[#071958]">
                                        Objetivos da semana
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Defina seus principais focos para a semana.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {goals.map((goal, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={goal}
                                            onChange={(event) => {
                                                const updated = [
                                                    ...goals,
                                                ]

                                                updated[index] =
                                                    event.target.value

                                                setGoals(updated)
                                            }}
                                            placeholder={`Objetivo ${index + 1}`}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-400 sm:text-sm"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeGoal(index)
                                            }
                                            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addGoal}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                                >
                                    <Plus className="size-4" />
                                    Adicionar objetivo
                                </button>
                            </div>
                        </section>

                        {/* HÁBITOS */}
                        <section>
                            <div className="mb-4 flex items-center gap-3">
                                <Sprout className="size-8 text-emerald-500" />

                                <div>
                                    <h3 className="font-bold text-[#071958]">
                                        Hábitos da semana
                                    </h3>

                                    <p className="text-xs text-slate-500">
                                        Escolha hábitos que deseja acompanhar.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {habits.map((habit, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                                    >
                                        <input
                                            type="text"
                                            value={habit.title}
                                            onChange={(event) => {
                                                const updated = [
                                                    ...habits,
                                                ]

                                                updated[index] = {
                                                    ...habit,
                                                    title:
                                                        event.target.value,
                                                }

                                                setHabits(updated)
                                            }}
                                            placeholder="Nome do hábito"
                                            className="min-w-0 flex-1 bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 sm:text-sm"
                                        />

                                        <select
                                            value={habit.targetDays}
                                            onChange={(event) => {
                                                const updated = [
                                                    ...habits,
                                                ]

                                                updated[index] = {
                                                    ...habit,
                                                    targetDays: Number(
                                                        event.target.value,
                                                    ),
                                                }

                                                setHabits(updated)
                                            }}
                                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
                                        >
                                            <option value={7}>7 dias</option>
                                            <option value={6}>6 dias</option>
                                            <option value={5}>5 dias</option>
                                            <option value={4}>4 dias</option>
                                            <option value={3}>3 dias</option>
                                            <option value={2}>2 dias</option>
                                            <option value={1}>1 dia</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeHabit(index)
                                            }
                                            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addHabit}
                                    className="flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                                >
                                    <Plus className="size-4" />
                                    Adicionar hábito
                                </button>
                            </div>
                        </section>
                    </div>

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleSave}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPending
                                ? 'Salvando...'
                                : 'Salvar planejamento'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
