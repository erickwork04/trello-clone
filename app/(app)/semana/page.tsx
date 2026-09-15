import { headers } from "next/headers";
import Link from 'next/link'

import {
    ChevronLeft,
    ChevronRight,
    Clock3,
    MoreHorizontal,
    Plus,
    Quote,
    Sprout,
    Target,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getWeekTasks } from "./_queries/get-week-tasks";
import { TaskRow } from "@/components/dashboard/task-row";
import { QuickWeekTask } from './_components/quick-week-task'
import { WeekPlannerDialog } from './_components/week-planner-dialog'
import { getWeekGoals } from './_queries/get-week-goals'
import { getWeekHabits } from './_queries/get-week-habits'
import { WeekGoalItem } from './_components/week-goal-item'
import { WeekHabitCard } from './_components/week-habit-card'


const areaMap = {
    WORK: "Trabalho",
    STUDIES: "Estudos",
    PERSONAL: "Pessoal",
    INBOX: "Pessoal",
} as const;

function getStartOfWeek(date: Date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    result.setDate(result.getDate() + diff);
    result.setHours(0, 0, 0, 0);

    return result;
}

function getEndOfWeek(start: Date) {
    const end = new Date(start);

    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return end;
}

function formatDay(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
    }).format(date);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
    }).format(date);
}

function formatWeekRange(start: Date, end: Date) {
    const startDay = new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
    }).format(start);

    const endDay = new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
    }).format(end);

    const month = new Intl.DateTimeFormat("pt-BR", {
        month: "long",
    }).format(end);

    const year = end.getFullYear();

    return `${startDay} – ${endDay} de ${month} de ${year}`;
}


function getDateKey(date: Date) {
    return date.toISOString().slice(0, 10)
}

function formatDateParam(date: Date) {
    return date.toISOString().slice(0, 10)
}

interface SemanaPageProps {
    searchParams: Promise<{
        week?: string
    }>
}

export default async function SemanaPage({
    searchParams,
}: SemanaPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return null;
    }

    const params = await searchParams

    const selectedDate = params.week
        ? new Date(`${params.week}T00:00:00`)
        : new Date()

    const today = new Date()

    const startOfWeek = getStartOfWeek(selectedDate)
    const endOfWeek = getEndOfWeek(startOfWeek)

    const previousWeek = new Date(startOfWeek)
    previousWeek.setDate(previousWeek.getDate() - 7)

    const nextWeek = new Date(startOfWeek)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const weekTasks = await getWeekTasks(
        session.user.id,
        startOfWeek,
        endOfWeek,
    );

    const weekGoals = await getWeekGoals(
        session.user.id,
        startOfWeek,
    )

    const weekHabits = await getWeekHabits(
        session.user.id,
        startOfWeek,
    )

    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfWeek);

        date.setDate(date.getDate() + index);

        return date;
    });

    const completedCount = weekTasks.filter(
        (task) => task.status === "DONE",
    ).length;

    const totalCount = weekTasks.length;

    const percentage =
        totalCount === 0
            ? 0
            : Math.round((completedCount / totalCount) * 100);

    return (
        <div className="h-full overflow-y-auto bg-[#f8fbff]">
            <div className="mx-auto w-full max-w-[1800px] px-6 py-6 2xl:px-8">
                {/* HEADER */}
                <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#071958]">
                            Minha Semana
                        </h1>

                        <p className="mt-1 text-base text-slate-500">
                            Organize sua semana com mais clareza e menos estresse. 💙
                        </p>
                    </div>

                    <div className="flex max-w-102.5 items-center gap-4 rounded-2xl bg-blue-50 px-6 py-4 text-blue-500">
                        <Quote className="size-8 shrink-0 fill-blue-400 text-blue-400" />

                        <p className="text-sm font-medium italic leading-5">
                            Uma semana organizada hoje,
                            <br />
                            mais tranquilidade amanhã.
                        </p>
                    </div>
                </div>

                {/* CONTROLES + PROGRESSO */}
                <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    {/* Navegação semana */}
                    <div className="flex w-fit items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <Link
                            href={`/semana?week=${formatDateParam(previousWeek)}`}
                            className="flex h-11 w-11 items-center justify-center border-r border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                            <ChevronLeft className="size-5" />
                        </Link>

                        <span className="px-7 text-sm font-semibold text-[#071958]">
                            {formatWeekRange(startOfWeek, endOfWeek)}
                        </span>

                        <Link
                            href={`/semana?week=${formatDateParam(nextWeek)}`}
                            className="flex h-11 w-11 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-blue-600"
                        >
                            <ChevronRight className="size-5" />
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        {/* Progresso semanal */}
                        <div className="flex min-w-117.5 items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-3 shadow-sm">
                            <div className="flex items-center gap-2 self-start pt-1">
                                <Clock3 className="size-5 text-[#071958]" />

                                <span className="text-sm font-bold text-[#071958]">
                                    Progresso da semana
                                </span>
                            </div>

                            <div className="flex flex-1 items-center gap-5">
                                {/* Círculo */}
                                <div
                                    className="relative flex size-16 shrink-0 items-center justify-center rounded-full"
                                    style={{
                                        background: `conic-gradient(#3b82f6 ${percentage}%, #e8eef7 ${percentage}% 100%)`,
                                    }}
                                >
                                    <div className="flex size-12 items-center justify-center rounded-full bg-white">
                                        <span className="text-sm font-bold text-[#071958]">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-[#071958]">
                                        <span className="font-bold">
                                            {completedCount} de {totalCount}
                                        </span>{" "}
                                        tarefas concluídas
                                    </p>

                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-blue-500 transition-all"
                                            style={{
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Planejar semana */}
                        <WeekPlannerDialog
                            key={getDateKey(startOfWeek)}
                            weekLabel={formatWeekRange(
                                startOfWeek,
                                endOfWeek,
                            )}
                            weekStart={getDateKey(startOfWeek)}
                            initialGoals={weekGoals.map((goal) => ({
                                id: goal.id,
                                title: goal.title,
                            }))}
                            initialHabits={weekHabits.map((habit) => ({
                                id: habit.id,
                                title: habit.title,
                                targetDays: habit.targetDays,
                            }))}
                        />
                    </div>
                </div>

                {/* DIAS DA SEMANA */}
                <div className="overflow-x-auto pb-2">
                    <div className="grid min-w-325 grid-cols-7 gap-2">
                        {days.map((day) => {
                            const dayKey = getDateKey(day);

                            const dayTasks = weekTasks.filter((task) => {
                                if (!task.plannedDate) {
                                    return false;
                                }

                                return getDateKey(task.plannedDate) === dayKey;
                            });

                            const isToday =
                                day.toDateString() === today.toDateString();

                            const completedDayTasks = dayTasks.filter(
                                (task) => task.status === "DONE",
                            ).length;

                            const totalDayTasks = dayTasks.length;

                            const dayPercentage =
                                totalDayTasks === 0
                                    ? 0
                                    : Math.round(
                                        (completedDayTasks / totalDayTasks) * 100,
                                    );

                            return (
                                <section
                                    key={day.toISOString()}
                                    className={[
                                        "flex min-h-100 flex-col rounded-xl border bg-white px-4 py-4 shadow-sm transition",
                                        isToday
                                            ? "border-blue-400 bg-blue-50/30 ring-1 ring-blue-200"
                                            : "border-slate-200",
                                    ].join(" ")}
                                >
                                    {/* Cabeçalho do dia */}
                                    <div>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-sm font-bold capitalize text-[#071958]">
                                                        {formatDay(day)}
                                                    </h2>

                                                    {isToday && (
                                                        <span className="rounded-md bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-600">
                                                            Hoje
                                                        </span>
                                                    )}
                                                </div>

                                                <p
                                                    className={[
                                                        "mt-1 text-xs",
                                                        isToday
                                                            ? "font-medium text-blue-500"
                                                            : "text-slate-500",
                                                    ].join(" ")}
                                                >
                                                    {formatDate(day)}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="rounded-md p-1 text-[#071958] transition hover:bg-slate-100"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                        </div>

                                        {/* Progresso do dia */}
                                        <div className="mt-3">
                                            <p className="text-xs text-slate-500">
                                                {completedDayTasks}/{totalDayTasks} concluídas
                                            </p>

                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-emerald-400 transition-all"
                                                    style={{
                                                        width: `${dayPercentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tarefas */}
                                    <div className="mt-5 flex-1 space-y-2">
                                        {dayTasks.length > 0 ? (
                                            dayTasks.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="overflow-hidden rounded-lg"
                                                >
                                                    <TaskRow
                                                        id={task.id}
                                                        title={task.title}
                                                        area={areaMap[task.area]}
                                                        completed={task.status === "DONE"}
                                                        topPriority={task.isTopPriority}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-200">
                                                <p className="text-center text-xs text-slate-400">
                                                    Nenhuma tarefa
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Nova tarefa */}
                                    <QuickWeekTask plannedDate={dayKey} />
                                </section>
                            );
                        })}
                    </div>
                </div>

                {/* PARTE INFERIOR */}
                <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                    {/* Objetivos */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white">
                                <Target className="size-5" />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#071958]">
                                    Objetivos da semana
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Três focos para uma semana mais produtiva.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            {weekGoals.length > 0 ? (
                                weekGoals.map((goal) => (
                                    <WeekGoalItem
                                        key={goal.id}
                                        id={goal.id}
                                        title={goal.title}
                                        completed={goal.completed}
                                    />
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-sm text-slate-400">
                                    Nenhum objetivo definido para esta semana.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Hábitos */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center">
                            <div className="flex items-center gap-3">
                                <Sprout className="size-8 text-emerald-500" />

                                <div>
                                    <h2 className="font-bold text-[#071958]">
                                        Hábitos da semana
                                    </h2>

                                    <p className="text-xs text-slate-500">
                                        Pequenas rotinas, grandes resultados.
                                    </p>
                                </div>
                            </div>


                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {weekHabits.length > 0 ? (
                                weekHabits.map((habit) => (
                                    <WeekHabitCard
                                        key={habit.id}
                                        id={habit.id}
                                        title={habit.title}
                                        targetDays={
                                            habit.targetDays
                                        }
                                        weekStart={getDateKey(
                                            startOfWeek,
                                        )}
                                        checks={habit.checks}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                                    Nenhum hábito definido
                                    para esta semana.
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Sprout className="size-5 text-blue-500" />

                                <p className="text-xs italic text-blue-600">
                                    Cuidar de você também faz parte do plano.
                                </p>
                            </div>

                            <span className="text-xs font-medium italic text-blue-600">
                                Você consegue! ✨
                            </span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function HabitCard({
    title,
    completed,
    targetDays,
}: {
    title: string
    completed: number
    targetDays: number
}) {
    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <div>
                <p className="text-sm font-semibold text-[#071958]">
                    {title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    {completed} de {targetDays} dias
                </p>
            </div>

            <div className="mt-4 flex gap-2">
                {Array.from({
                    length: targetDays,
                }).map((_, index) => {
                    const done =
                        index < completed

                    return (
                        <button
                            key={index}
                            type="button"
                            className={[
                                'flex size-6 items-center justify-center rounded-full border text-[10px] transition',
                                done
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50',
                            ].join(' ')}
                        >
                            {done && '✓'}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}