import { and, asc, eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { CalendarDays, CheckCircle2, Circle, ListChecks } from 'lucide-react'
import { db } from '@/db'
import { card } from '@/db/schema/card'
import { boardColumn } from '@/db/schema/column'
import { meeting } from '@/db/schema/meeting'
import { project } from '@/db/schema/project'
import { projectRequirement } from '@/db/schema/project-requirement'
import { projectShare } from '@/db/schema/project-share'
import { requirementSurvey } from '@/db/schema/requirement-survey'
import { hashProjectShareToken } from '@/lib/project-share-token'

const statusLabel = {
    PLANNING: 'Planejamento',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado',
} as const

const requirementStatusLabel = {
    REVIEW: 'Em análise',
    APPROVED: 'Aprovado',
    IN_PROGRESS: 'Em desenvolvimento',
    COMPLETED: 'Concluído',
    REJECTED: 'Rejeitado',
} as const

const surveyFields = [
    ['problem', 'Problema a resolver'],
    ['currentProcess', 'Processo atual'],
    ['mainGoal', 'Objetivo principal'],
    ['neededFeatures', 'Funcionalidades necessárias'],
    ['firstVersionFeatures', 'Escopo da primeira versão'],
    ['references', 'Referências'],
    ['integrations', 'Integrações'],
    ['businessRules', 'Regras de negócio'],
    ['rolesAndPermissions', 'Papéis e permissões'],
    ['approvals', 'Aprovações'],
    ['exceptions', 'Exceções'],
    ['desiredDeadline', 'Prazo desejado'],
    ['successCriteria', 'Critérios de sucesso'],
] as const

function dateLabel(value: string | Date | null | undefined) {
    if (!value) return 'Sem data'
    const date = dayjs(value).locale('pt-br')
    if (!date.isValid()) return 'Sem data'
    return date.format('D [de] MMMM [de] YYYY')
}

export default async function PublicProjectPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    await connection()
    const { token } = await params
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound()

    const tokenHash = hashProjectShareToken(token)
    const [shared] = await db
        .select({ projectId: projectShare.projectId })
        .from(projectShare)
        .where(and(eq(projectShare.tokenHash, tokenHash), eq(projectShare.isActive, true)))
        .limit(1)
    if (!shared) notFound()

    const [projectInfo] = await db
        .select({
            name: project.name,
            description: project.description,
            status: project.status,
            dueDate: project.dueDate,
        })
        .from(project)
        .where(eq(project.id, shared.projectId))
        .limit(1)
    if (!projectInfo) notFound()

    const [requirements, survey, meetings] = await Promise.all([
        db
            .select({
                id: projectRequirement.id,
                title: projectRequirement.title,
                description: projectRequirement.description,
                status: projectRequirement.status,
                acceptanceCriteria: projectRequirement.acceptanceCriteria,
            })
            .from(projectRequirement)
            .where(eq(projectRequirement.projectId, shared.projectId))
            .orderBy(asc(projectRequirement.createdAt)),
        db
            .select({
                problem: requirementSurvey.problem,
                currentProcess: requirementSurvey.currentProcess,
                mainGoal: requirementSurvey.mainGoal,
                neededFeatures: requirementSurvey.neededFeatures,
                firstVersionFeatures: requirementSurvey.firstVersionFeatures,
                references: requirementSurvey.references,
                integrations: requirementSurvey.integrations,
                businessRules: requirementSurvey.businessRules,
                rolesAndPermissions: requirementSurvey.rolesAndPermissions,
                approvals: requirementSurvey.approvals,
                exceptions: requirementSurvey.exceptions,
                desiredDeadline: requirementSurvey.desiredDeadline,
                successCriteria: requirementSurvey.successCriteria,
            })
            .from(requirementSurvey)
            .where(eq(requirementSurvey.projectId, shared.projectId))
            .limit(1),
        db
            .select({
                id: meeting.id,
                title: meeting.title,
                meetingDate: meeting.meetingDate,
            })
            .from(meeting)
            .where(eq(meeting.projectId, shared.projectId))
            .orderBy(asc(meeting.meetingDate)),
    ])

    const tasks = await db
        .select({
            id: card.id,
            name: card.name,
            description: card.description,
            dueDate: card.dueDate,
            columnTitle: boardColumn.title,
            columnType: boardColumn.type,
        })
        .from(card)
        .innerJoin(projectRequirement, eq(card.requirementId, projectRequirement.id))
        .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
        .where(eq(projectRequirement.projectId, shared.projectId))
        .orderBy(asc(boardColumn.position), asc(card.position))

    const completedTasks = tasks.filter((task) => task.columnType === 'DONE').length
    const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    const answers = survey[0]

    return (
        <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:py-12">
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <ListChecks className="size-5" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-accent-foreground">Connect Board · Projeto compartilhado</p>
                        <p className="text-sm text-muted-foreground">Visualização somente leitura</p>
                    </div>
                </header>

                <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{statusLabel[projectInfo.status]}</span>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight">{projectInfo.name}</h1>
                            {projectInfo.description && <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">{projectInfo.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                            <CalendarDays className="size-4 text-primary" />
                            Prazo: {dateLabel(projectInfo.dueDate)}
                        </div>
                    </div>
                    <div className="mt-7">
                        <div className="mb-2 flex justify-between text-sm">
                            <span className="font-medium">Progresso das tarefas</span>
                            <span className="text-muted-foreground">{completedTasks} de {tasks.length} concluídas · {progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </section>

                <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold">Tarefas</h2>
                    {!tasks.length ? <p className="mt-4 text-sm text-muted-foreground">Este projeto ainda não tem tarefas vinculadas a requisitos.</p> : (
                        <div className="mt-4 divide-y divide-border">
                            {tasks.map((task) => (
                                <article key={task.id} className="flex gap-3 py-4">
                                    {task.columnType === 'DONE' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-(--column-green)" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/40" />}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="font-medium">{task.name}</h3>
                                            <div className="flex gap-3 text-xs text-muted-foreground"><span>{task.columnTitle}</span>{task.dueDate && <span>Prazo: {dateLabel(task.dueDate)}</span>}</div>
                                        </div>
                                        {task.description && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description}</p>}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {requirements.length > 0 && <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold">Requisitos</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {requirements.map((item) => <article key={item.id} className="rounded-xl border border-border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-medium">{item.title}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{requirementStatusLabel[item.status]}</span></div>
                            {item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{item.description}</p>}
                            {item.acceptanceCriteria && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Critérios de aceite: </span>{item.acceptanceCriteria}</p>}
                        </article>)}
                    </div>
                </section>}

                {answers && surveyFields.some(([key]) => answers[key]) && <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold">Levantamento</h2>
                    <dl className="mt-4 grid gap-5 sm:grid-cols-2">
                        {surveyFields.map(([key, label]) => answers[key] && <div key={key}><dt className="text-sm font-medium text-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{answers[key]}</dd></div>)}
                    </dl>
                </section>}

                {meetings.length > 0 && <section className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-semibold">Reuniões</h2>
                    <ul className="mt-4 divide-y divide-border">{meetings.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="font-medium">{item.title}</span><span className="text-sm text-muted-foreground">{dateLabel(item.meetingDate)}</span></li>)}</ul>
                </section>}

                <p className="mt-8 text-center text-xs text-muted-foreground">Conteúdo disponibilizado pelo proprietário do projeto.</p>
            </div>
        </main>
    )
}
