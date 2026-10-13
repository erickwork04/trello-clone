'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Client } from '@/db/schema/client'
import { Project } from '@/db/schema/project'
import { RequirementSurvey } from '@/db/schema/requirement-survey'
import { ProjectRequirement } from '@/db/schema/project-requirement'
import { Meeting } from '@/db/schema/meeting'
import { ProjectShareDialog } from './project-share-dialog'
import {
    convertRequirementToTask,
    deleteClient,
    deleteMeeting,
    deleteProject,
    deleteRequirement,
    saveClient,
    saveMeeting,
    saveProject,
    saveRequirement,
    saveSurvey,
} from '@/app/(app)/board/work-actions'

type Section = 'projects' | 'clients' | 'requirements' | 'meetings'
type ModalKind = 'client' | 'project' | 'requirement' | 'meeting' | 'survey'
type WorkData = {
    clients: Client[]
    projects: Project[]
    surveys: RequirementSurvey[]
    requirements: ProjectRequirement[]
    meetings: Meeting[]
    linkedRequirementIds: string[]
}
type RecordValue = Record<string, string>

const projectStatus: Record<Project['status'], string> = {
    PLANNING: 'Planejamento',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado',
}
const requirementStatus: Record<ProjectRequirement['status'], string> = {
    REVIEW: 'Em análise',
    APPROVED: 'Aprovado',
    IN_PROGRESS: 'Em desenvolvimento',
    COMPLETED: 'Concluído',
    REJECTED: 'Rejeitado',
}
const priorityLabel: Record<ProjectRequirement['priority'], string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
}
const fieldClass =
    'mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
const labelClass = 'block text-sm font-medium text-slate-700'

function dateLabel(date?: string | Date | null) {
    if (!date) return 'Sem data'

    const value =
        date instanceof Date
            ? date.toISOString().slice(0, 10)
            : String(date).slice(0, 10)

    const parsedDate = new Date(`${value}T12:00:00`)

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Sem data'
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'medium',
    }).format(parsedDate)
}

export function WorkManagement({
    data,
    onBoard,
}: {
    data: WorkData
    onBoard: () => void
}) {
    const [section, setSection] = useState<Section>('projects')
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null
    )
    const [modal, setModal] = useState<{
        kind: ModalKind
        record?: RecordValue
        projectId?: string
    } | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{
        kind: 'client' | 'project' | 'requirement' | 'meeting'
        id: string
        title: string
    } | null>(null)
    const [projectFilter, setProjectFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [requirementStatusFilter, setRequirementStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const selectedProject = data.projects.find(
        (item) => item.id === selectedProjectId
    )
    const filteredProjects = data.projects.filter(
        (item) =>
            (!projectFilter || item.clientId === projectFilter) &&
            (!statusFilter || item.status === statusFilter)
    )
    const filteredRequirements = data.requirements.filter(
        (item) =>
            (!requirementStatusFilter ||
                item.status === requirementStatusFilter) &&
            (!priorityFilter || item.priority === priorityFilter)
    )

    function submit(kind: ModalKind, values: RecordValue, id?: string) {
        startTransition(async () => {
            let result
            if (kind === 'client')
                result = await saveClient({
                    ...values,
                    ...(id ? { id } : {}),
                } as never)
            if (kind === 'project')
                result = await saveProject({
                    ...values,
                    ...(id ? { id } : {}),
                } as never)
            if (kind === 'requirement')
                result = await saveRequirement({
                    ...values,
                    ...(id ? { id } : {}),
                } as never)
            if (kind === 'meeting')
                result = await saveMeeting({
                    ...values,
                    ...(id ? { id } : {}),
                } as never)
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            toast.success(id ? 'Alterações salvas.' : 'Cadastro criado.')
            setModal(null)
            router.refresh()
        })
    }

    function remove() {
        if (!deleteTarget) return
        startTransition(async () => {
            const { kind, id } = deleteTarget
            if (kind === 'project') {
                const result = await deleteProject({ id })
                if (result?.serverError) {
                    toast.error(result.serverError)
                    return
                }
                const preserved = result?.data?.preservedClientMeetings ?? 0
                const shared = result?.data?.clientHasOtherProjects ?? false
                toast.success(
                    `Projeto e registros vinculados excluídos. Cliente preservado${shared ? ' com outros projetos' : ''}${preserved ? ` e ${preserved} reunião(ões) mantida(s)` : ''}.`
                )
            } else {
                const result =
                    kind === 'client'
                        ? await deleteClient({ id })
                        : kind === 'requirement'
                          ? await deleteRequirement({ id })
                          : await deleteMeeting({ id })
                if (result?.serverError) {
                    toast.error(result.serverError)
                    return
                }
                toast.success('Registro excluído.')
            }
            setDeleteTarget(null)
            if (kind === 'project' && selectedProjectId === id)
                setSelectedProjectId(null)
            router.refresh()
        })
    }

    function convertToTask(id: string) {
        startTransition(async () => {
            const result = await convertRequirementToTask({ id })
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            toast.success(
                'Tarefa criada no Kanban com referência ao requisito.'
            )
            router.refresh()
        })
    }

    const tabs: {
        key: Section
        label: string
        icon: typeof BriefcaseBusiness
    }[] = [
        { key: 'projects', label: 'Projetos', icon: BriefcaseBusiness },
        { key: 'clients', label: 'Clientes', icon: Users },
        { key: 'requirements', label: 'Requisitos', icon: ClipboardList },
        { key: 'meetings', label: 'Reuniões', icon: CalendarDays },
    ]

    return (
        <div className="flex h-full min-h-0 flex-col bg-slate-50">
            <header className="shrink-0 border-b border-slate-200 bg-white px-4 pt-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <BriefcaseBusiness className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Trabalho
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Clientes, projetos e requisitos em um só
                                    lugar.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {section === 'projects' && (
                            <button
                                onClick={() => setModal({ kind: 'project' })}
                                disabled={!data.clients.length}
                                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Plus className="size-4" />
                                Novo projeto
                            </button>
                        )}
                        {section === 'clients' && (
                            <button
                                onClick={() => setModal({ kind: 'client' })}
                                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <Plus className="size-4" />
                                Novo cliente
                            </button>
                        )}
                        {section === 'meetings' && (
                            <button
                                onClick={() => setModal({ kind: 'meeting' })}
                                disabled={!data.clients.length}
                                className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Plus className="size-4" />
                                Nova reunião
                            </button>
                        )}
                    </div>
                </div>
                <nav
                    aria-label="Seções de Trabalho"
                    className="mt-5 flex gap-1 overflow-x-auto"
                >
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSection(key)
                                setSelectedProjectId(null)
                            }}
                            className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${section === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={onBoard}
                        className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                        Quadro Kanban
                    </button>
                </nav>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {section === 'projects' &&
                    (selectedProject ? (
                        <ProjectDetail
                            key={selectedProject.id}
                            project={selectedProject}
                            client={data.clients.find(
                                (item) => item.id === selectedProject.clientId
                            )}
                            survey={data.surveys.find(
                                (item) => item.projectId === selectedProject.id
                            )}
                            requirements={data.requirements.filter(
                                (item) => item.projectId === selectedProject.id
                            )}
                            meetings={data.meetings.filter(
                                (item) => item.projectId === selectedProject.id
                            )}
                            onBack={() => setSelectedProjectId(null)}
                            onEdit={() =>
                                setModal({
                                    kind: 'project',
                                    record: projectRecord(selectedProject),
                                })
                            }
                            onDelete={() =>
                                setDeleteTarget({
                                    kind: 'project',
                                    id: selectedProject.id,
                                    title: selectedProject.name,
                                })
                            }
                            onSurvey={() =>
                                document
                                    .querySelector('h3')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            onRequirement={() =>
                                setModal({
                                    kind: 'requirement',
                                    projectId: selectedProject.id,
                                })
                            }
                            onEditRequirement={(item) =>
                                setModal({
                                    kind: 'requirement',
                                    record: requirementRecord(item),
                                })
                            }
                            onRemoveRequirement={(item) =>
                                setDeleteTarget({
                                    kind: 'requirement',
                                    id: item.id,
                                    title: item.title,
                                })
                            }
                            onMeeting={() => {
                                setSection('meetings')
                                setModal({
                                    kind: 'meeting',
                                    record: {
                                        clientId: selectedProject.clientId,
                                        projectId: selectedProject.id,
                                    },
                                })
                            }}
                        />
                    ) : (
                        <section>
                            <SectionHeading
                                title="Projetos"
                                subtitle="Acompanhe os projetos e abra cada um para registrar o levantamento e os requisitos."
                            />
                            <div className="mb-4 flex flex-wrap gap-3">
                                <select
                                    className={`${fieldClass} mt-0 w-auto min-w-48`}
                                    value={projectFilter}
                                    onChange={(event) =>
                                        setProjectFilter(event.target.value)
                                    }
                                >
                                    <option value="">Todos os clientes</option>
                                    {data.clients.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className={`${fieldClass} mt-0 w-auto min-w-44`}
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                >
                                    <option value="">Todos os status</option>
                                    {Object.entries(projectStatus).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                            {filteredProjects.length ? (
                                <div className="grid gap-3 lg:grid-cols-2">
                                    {filteredProjects.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() =>
                                                setSelectedProjectId(item.id)
                                            }
                                            className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h2 className="font-semibold text-slate-900">
                                                        {item.name}
                                                    </h2>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {
                                                            data.clients.find(
                                                                (c) =>
                                                                    c.id ===
                                                                    item.clientId
                                                            )?.name
                                                        }
                                                    </p>
                                                </div>
                                                <StatusBadge
                                                    label={
                                                        projectStatus[
                                                            item.status
                                                        ]
                                                    }
                                                />
                                            </div>
                                            {item.description && (
                                                <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                                                    {item.description}
                                                </p>
                                            )}
                                            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                                <span>
                                                    {
                                                        data.requirements.filter(
                                                            (r) =>
                                                                r.projectId ===
                                                                item.id
                                                        ).length
                                                    }{' '}
                                                    requisitos
                                                </span>
                                                <span>
                                                    Prazo:{' '}
                                                    {dateLabel(item.dueDate)}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Nenhum projeto por aqui"
                                    description={
                                        data.clients.length
                                            ? 'Crie seu primeiro projeto e escolha o cliente.'
                                            : 'Cadastre um cliente antes de criar um projeto.'
                                    }
                                    action={
                                        data.clients.length ? (
                                            <button
                                                onClick={() =>
                                                    setModal({
                                                        kind: 'project',
                                                    })
                                                }
                                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                            >
                                                Criar projeto
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    setSection('clients')
                                                }
                                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                            >
                                                Cadastrar cliente
                                            </button>
                                        )
                                    }
                                />
                            )}
                        </section>
                    ))}

                {section === 'clients' && (
                    <section>
                        <SectionHeading
                            title="Clientes"
                            subtitle="Seus contatos e empresas, junto dos projetos relacionados."
                        />
                        {data.clients.length ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                                {data.clients.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <h2 className="font-semibold text-slate-900">
                                                    {item.name}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.contactName ||
                                                        'Contato não informado'}
                                                </p>
                                            </div>
                                            <RecordActions
                                                edit={() =>
                                                    setModal({
                                                        kind: 'client',
                                                        record: clientRecord(
                                                            item
                                                        ),
                                                    })
                                                }
                                                remove={() =>
                                                    setDeleteTarget({
                                                        kind: 'client',
                                                        id: item.id,
                                                        title: item.name,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="mt-4 space-y-1 text-sm text-slate-600">
                                            {item.email && <p>{item.email}</p>}
                                            {item.phone && <p>{item.phone}</p>}
                                            {item.notes && (
                                                <p className="mt-3 whitespace-pre-wrap text-slate-500">
                                                    {item.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-4 border-t border-slate-100 pt-3">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Projetos vinculados
                                            </p>
                                            {data.projects.filter(
                                                (p) => p.clientId === item.id
                                            ).length ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {data.projects
                                                        .filter(
                                                            (p) =>
                                                                p.clientId ===
                                                                item.id
                                                        )
                                                        .map((p) => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setSection(
                                                                        'projects'
                                                                    )
                                                                    setSelectedProjectId(
                                                                        p.id
                                                                    )
                                                                }}
                                                                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                                            >
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500">
                                                    Sem projetos cadastrados.
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Cadastre seu primeiro cliente"
                                description="O cadastro leva poucos minutos e permite vincular projetos e reuniões."
                                action={
                                    <button
                                        onClick={() =>
                                            setModal({ kind: 'client' })
                                        }
                                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                    >
                                        Novo cliente
                                    </button>
                                }
                            />
                        )}
                    </section>
                )}

                {section === 'requirements' && (
                    <section>
                        <SectionHeading
                            title="Requisitos"
                            subtitle="Acompanhe as solicitações registradas nos projetos."
                        />
                        <div className="mb-4 flex flex-wrap gap-3">
                            <select
                                className={`${fieldClass} mt-0 w-auto min-w-44`}
                                value={requirementStatusFilter}
                                onChange={(event) =>
                                    setRequirementStatusFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">Todos os status</option>
                                {Object.entries(requirementStatus).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                            <select
                                className={`${fieldClass} mt-0 w-auto min-w-40`}
                                value={priorityFilter}
                                onChange={(event) =>
                                    setPriorityFilter(event.target.value)
                                }
                            >
                                <option value="">Todas as prioridades</option>
                                {Object.entries(priorityLabel).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                        {filteredRequirements.length ? (
                            <div className="space-y-3">
                                {filteredRequirements.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <button
                                                className="text-left"
                                                onClick={() => {
                                                    setSection('projects')
                                                    setSelectedProjectId(
                                                        item.projectId
                                                    )
                                                }}
                                            >
                                                <p className="font-semibold text-slate-900">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {
                                                        data.projects.find(
                                                            (p) =>
                                                                p.id ===
                                                                item.projectId
                                                        )?.name
                                                    }{' '}
                                                    ·{' '}
                                                    {item.type === 'FUNCTIONAL'
                                                        ? 'Funcional'
                                                        : 'Não funcional'}
                                                </p>
                                            </button>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    label={
                                                        requirementStatus[
                                                            item.status
                                                        ]
                                                    }
                                                />
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.priority === 'HIGH' ? 'bg-rose-50 text-rose-700' : item.priority === 'LOW' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {
                                                        priorityLabel[
                                                            item.priority
                                                        ]
                                                    }
                                                </span>
                                                {item.status === 'APPROVED' &&
                                                    (data.linkedRequirementIds.includes(
                                                        item.id
                                                    ) ? (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                            No Kanban
                                                        </span>
                                                    ) : (
                                                        <button
                                                            disabled={pending}
                                                            onClick={() =>
                                                                convertToTask(
                                                                    item.id
                                                                )
                                                            }
                                                            className="rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                                                        >
                                                            Criar tarefa
                                                        </button>
                                                    ))}
                                                <RecordActions
                                                    edit={() =>
                                                        setModal({
                                                            kind: 'requirement',
                                                            record: requirementRecord(
                                                                item
                                                            ),
                                                        })
                                                    }
                                                    remove={() =>
                                                        setDeleteTarget({
                                                            kind: 'requirement',
                                                            id: item.id,
                                                            title: item.title,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        {item.description && (
                                            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                                                {item.description}
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhum requisito encontrado"
                                description={
                                    data.projects.length
                                        ? 'Abra um projeto e registre os requisitos identificados.'
                                        : 'Crie um projeto antes de registrar requisitos.'
                                }
                                action={
                                    data.projects.length ? (
                                        <button
                                            onClick={() => {
                                                setSection('projects')
                                                setSelectedProjectId(
                                                    data.projects[0].id
                                                )
                                            }}
                                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            Abrir projetos
                                        </button>
                                    ) : null
                                }
                            />
                        )}
                    </section>
                )}

                {section === 'meetings' && (
                    <section>
                        <SectionHeading
                            title="Reuniões"
                            subtitle="Registre conversas, decisões e próximos passos."
                        />
                        {data.meetings.length ? (
                            <div className="space-y-3">
                                {data.meetings.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <h2 className="font-semibold text-slate-900">
                                                    {item.title}
                                                </h2>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {
                                                        data.clients.find(
                                                            (c) =>
                                                                c.id ===
                                                                item.clientId
                                                        )?.name
                                                    }
                                                    {item.projectId
                                                        ? ` · ${data.projects.find((p) => p.id === item.projectId)?.name ?? ''}`
                                                        : ''}{' '}
                                                    ·{' '}
                                                    {dateLabel(
                                                        item.meetingDate
                                                    )}
                                                </p>
                                            </div>
                                            <RecordActions
                                                edit={() =>
                                                    setModal({
                                                        kind: 'meeting',
                                                        record: meetingRecord(
                                                            item
                                                        ),
                                                    })
                                                }
                                                remove={() =>
                                                    setDeleteTarget({
                                                        kind: 'meeting',
                                                        id: item.id,
                                                        title: item.title,
                                                    })
                                                }
                                            />
                                        </div>
                                        {item.participants && (
                                            <p className="mt-3 text-sm text-slate-600">
                                                <strong>Participantes:</strong>{' '}
                                                {item.participants}
                                            </p>
                                        )}
                                        {(item.notes ||
                                            item.decisions ||
                                            item.nextSteps) && (
                                            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                                                {item.notes && (
                                                    <TextBlock
                                                        title="Anotações"
                                                        text={item.notes}
                                                    />
                                                )}
                                                {item.decisions && (
                                                    <TextBlock
                                                        title="Decisões"
                                                        text={item.decisions}
                                                    />
                                                )}
                                                {item.nextSteps && (
                                                    <TextBlock
                                                        title="Próximos passos"
                                                        text={item.nextSteps}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title="Nenhuma reunião registrada"
                                description="Guarde as anotações importantes das conversas com seus clientes."
                                action={
                                    data.clients.length ? (
                                        <button
                                            onClick={() =>
                                                setModal({ kind: 'meeting' })
                                            }
                                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                                        >
                                            Registrar reunião
                                        </button>
                                    ) : null
                                }
                            />
                        )}
                    </section>
                )}
            </main>

            {modal && (
                <WorkForm
                    key={`${modal.kind}-${modal.record?.id ?? 'new'}`}
                    kind={modal.kind}
                    initial={modal.record}
                    projectId={modal.projectId}
                    data={data}
                    pending={pending}
                    onClose={() => setModal(null)}
                    onSubmit={submit}
                />
            )}
            <AlertDialog
                open={Boolean(deleteTarget)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir “{deleteTarget?.title}”?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.kind === 'project'
                                ? 'Exclusão permanente: o projeto, o levantamento, os requisitos, as reuniões vinculadas e os cards Kanban criados a partir desses requisitos serão excluídos. O cadastro do cliente e os demais projetos e reuniões dele serão preservados.'
                                : 'Essa ação não pode ser desfeita. Registros relacionados impedem a exclusão e não serão apagados automaticamente.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={pending}
                            onClick={(event) => {
                                event.preventDefault()
                                remove()
                            }}
                            className="bg-rose-600 text-white hover:bg-rose-700"
                        >
                            Excluir permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function ProjectDetail({
    project,
    client,
    survey,
    requirements,
    meetings,
    onBack,
    onEdit,
    onDelete,
    onSurvey,
    onRequirement,
    onEditRequirement,
    onRemoveRequirement,
    onMeeting,
}: {
    project: Project
    client?: Client
    survey?: RequirementSurvey
    requirements: ProjectRequirement[]
    meetings: Meeting[]
    onBack: () => void
    onEdit: () => void
    onDelete: () => void
    onSurvey: () => void
    onRequirement: () => void
    onEditRequirement: (item: ProjectRequirement) => void
    onRemoveRequirement: (item: ProjectRequirement) => void
    onMeeting: () => void
}) {
    const steps = [
        {
            title: 'Entender o negócio',
            fields: [
                ['problem', 'Qual problema o cliente deseja resolver?'],
                ['currentProcess', 'Como o processo funciona atualmente?'],
                ['users', 'Quem utilizará o sistema?'],
                ['mainGoal', 'Qual é o principal objetivo do projeto?'],
            ],
        },
        {
            title: 'Funcionalidades',
            fields: [
                ['neededFeatures', 'Quais funcionalidades o cliente precisa?'],
                [
                    'firstVersionFeatures',
                    'Quais são indispensáveis para a primeira versão?',
                ],
                ['references', 'Existem sistemas de referência?'],
                [
                    'integrations',
                    'Há necessidade de integrações com APIs, WhatsApp, pagamentos ou outros serviços?',
                ],
            ],
        },
        {
            title: 'Regras de negócio',
            fields: [
                [
                    'businessRules',
                    'Existem cálculos, restrições ou regras específicas?',
                ],
                [
                    'rolesAndPermissions',
                    'Existem tipos de usuários e permissões?',
                ],
                ['approvals', 'Há aprovações ou etapas obrigatórias?'],
                [
                    'exceptions',
                    'Existem exceções que o sistema precisa tratar?',
                ],
            ],
        },
        {
            title: 'Entrega e observações',
            fields: [
                ['desiredDeadline', 'Qual é o prazo desejado?'],
                ['budget', 'Existe orçamento definido?'],
                [
                    'successCriteria',
                    'Como o cliente avaliará se o sistema está pronto?',
                ],
                ['observations', 'Observações adicionais'],
            ],
        },
    ] as const
    const [step, setStep] = useState(0)
    const [answer, setAnswer] = useState<Record<string, string>>(() =>
        survey
            ? Object.fromEntries(
                  Object.entries(survey)
                      .filter(
                          ([key]) =>
                              ![
                                  'id',
                                  'userId',
                                  'projectId',
                                  'createdAt',
                                  'updatedAt',
                              ].includes(key)
                      )
                      .map(([key, value]) => [key, String(value ?? '')])
              )
            : {}
    )
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    const answered = Object.values(answer).filter(Boolean).length
    function saveAnswers() {
        startTransition(async () => {
            const result = await saveSurvey({
                projectId: project.id,
                ...answer,
            } as never)
            if (result?.serverError) {
                toast.error(result.serverError)
                return
            }
            toast.success('Levantamento salvo.')
            router.refresh()
        })
    }
    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex justify-end">
                <button
                    onClick={onSurvey}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                    {survey ? 'Editar levantamento' : 'Novo levantamento'}
                </button>
            </div>
            <button
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft className="size-4" />
                Voltar aos projetos
            </button>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {client?.name}
                        </span>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                            {project.name}
                        </h2>
                        <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-slate-600">
                            {project.description || 'Sem descrição adicionada.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <ProjectShareDialog projectId={project.id} />
                        <button
                            onClick={onEdit}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                        >
                            Editar projeto
                        </button>
                        <button
                            onClick={onDelete}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <StatusBadge label={projectStatus[project.status]} />
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        Prazo: {dateLabel(project.dueDate)}
                    </span>
                </div>
            </section>
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Levantamento de requisitos
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Etapa {step + 1} de 4 · {answered} respostas
                            preenchidas · salvamento parcial disponível
                        </p>
                    </div>
                    <button
                        onClick={saveAnswers}
                        disabled={pending}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {pending
                            ? 'Salvando…'
                            : survey
                              ? 'Salvar levantamento'
                              : 'Salvar rascunho'}
                    </button>
                </div>
                <div className="mt-4 flex gap-1">
                    {steps.map((item, index) => (
                        <button
                            key={item.title}
                            onClick={() => setStep(index)}
                            className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-blue-600' : 'bg-slate-200'}`}
                            aria-label={`Ir para etapa ${index + 1}: ${item.title}`}
                        />
                    ))}
                </div>
                <h4 className="mb-4 mt-5 font-medium text-slate-800">
                    {steps[step].title}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                    {steps[step].fields.map(([name, label]) => (
                        <label key={name} className={labelClass}>
                            {label}
                            <textarea
                                rows={3}
                                className={fieldClass}
                                value={answer[name] ?? ''}
                                onChange={(event) =>
                                    setAnswer((current) => ({
                                        ...current,
                                        [name]: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    ))}
                </div>
                <div className="mt-5 flex justify-between">
                    <button
                        disabled={step === 0}
                        onClick={() =>
                            setStep((value) => Math.max(0, value - 1))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                    >
                        <ChevronLeft className="size-4" />
                        Anterior
                    </button>
                    <button
                        disabled={step === 3}
                        onClick={() =>
                            setStep((value) => Math.min(3, value + 1))
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40"
                    >
                        Próxima
                        <ChevronRight className="size-4" />
                    </button>
                </div>
                <p className="mt-3 text-xs text-slate-400">
                    Criado:{' '}
                    {survey
                        ? dateLabel(survey.createdAt)
                        : 'será registrado ao salvar'}{' '}
                    · Atualizado: {survey ? dateLabel(survey.updatedAt) : '—'}
                </p>
            </section>
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Requisitos do projeto
                        </h3>
                        <p className="text-sm text-slate-500">
                            {requirements.length} requisito(s)
                        </p>
                    </div>
                    <button
                        onClick={onRequirement}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                        <Plus className="size-4" />
                        Novo requisito
                    </button>
                </div>
                {requirements.length ? (
                    <div className="mt-4 divide-y divide-slate-100">
                        {requirements.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-3 py-3"
                            >
                                <div>
                                    <p className="font-medium text-slate-800">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.type === 'FUNCTIONAL'
                                            ? 'Funcional'
                                            : 'Não funcional'}{' '}
                                        · {priorityLabel[item.priority]} ·{' '}
                                        {requirementStatus[item.status]}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        aria-label={`Editar ${item.title}`}
                                        onClick={() => onEditRequirement(item)}
                                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                                    >
                                        <Pencil className="size-4" />
                                    </button>
                                    <button
                                        aria-label={`Excluir ${item.title}`}
                                        onClick={() =>
                                            onRemoveRequirement(item)
                                        }
                                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="py-6 text-center text-sm text-slate-500">
                        Ainda não há requisitos registrados.
                    </p>
                )}
            </section>
            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Reuniões relacionadas
                        </h3>
                        <p className="text-sm text-slate-500">
                            {meetings.length} reunião(ões)
                        </p>
                    </div>
                    <button
                        onClick={onMeeting}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                    >
                        Registrar reunião
                    </button>
                </div>
                {meetings.map((item) => (
                    <p key={item.id} className="mt-3 text-sm text-slate-700">
                        {item.title}{' '}
                        <span className="text-slate-400">
                            · {dateLabel(item.meetingDate)}
                        </span>
                    </p>
                ))}
            </section>
        </div>
    )
}

function WorkForm({
    kind,
    initial,
    projectId,
    data,
    pending,
    onClose,
    onSubmit,
}: {
    kind: ModalKind
    initial?: RecordValue
    projectId?: string
    data: WorkData
    pending: boolean
    onClose: () => void
    onSubmit: (kind: ModalKind, values: RecordValue, id?: string) => void
}) {
    const [values, setValues] = useState<RecordValue>(() => ({
        ...(kind === 'project' ? { status: 'PLANNING' } : {}),
        ...(kind === 'requirement'
            ? { type: 'FUNCTIONAL', priority: 'MEDIUM', status: 'REVIEW' }
            : {}),
        ...initial,
        ...(projectId ? { projectId } : {}),
        ...(kind === 'project' && !initial?.clientId && data.clients[0]
            ? { clientId: data.clients[0].id }
            : {}),
        ...(kind === 'meeting' && !initial?.clientId && data.clients[0]
            ? { clientId: data.clients[0].id }
            : {}),
    }))
    const [step, setStep] = useState(0)
    const [pendingSurvey, startTransition] = useTransition()
    const router = useRouter()
    const projectsForClient = data.projects.filter(
        (item) => item.clientId === values.clientId
    )
    const set = (name: string, value: string) =>
        setValues((current) => ({ ...current, [name]: value }))

    if (kind === 'survey') {
        const fields = [
            [
                ['problem', 'Qual problema o cliente deseja resolver?'],
                ['currentProcess', 'Como o processo funciona atualmente?'],
                ['users', 'Quem utilizará o sistema?'],
                ['mainGoal', 'Qual é o principal objetivo do projeto?'],
            ],
            [
                ['neededFeatures', 'Quais funcionalidades o cliente precisa?'],
                [
                    'firstVersionFeatures',
                    'Quais são indispensáveis para a primeira versão?',
                ],
                ['references', 'Existem sistemas de referência?'],
                ['integrations', 'Quais integrações são necessárias?'],
            ],
            [
                [
                    'businessRules',
                    'Quais regras, cálculos ou restrições existem?',
                ],
                ['rolesAndPermissions', 'Quais tipos de usuário e permissões?'],
                ['approvals', 'Há aprovações ou etapas obrigatórias?'],
                ['exceptions', 'Quais exceções o sistema deve tratar?'],
            ],
            [
                ['desiredDeadline', 'Qual é o prazo desejado?'],
                ['budget', 'Existe orçamento definido?'],
                ['successCriteria', 'Como o cliente avaliará a entrega?'],
                ['observations', 'Observações adicionais'],
            ],
        ] as const
        function saveSurveyStep() {
            startTransition(async () => {
                const result = await saveSurvey({
                    projectId: projectId!,
                    ...values,
                } as never)
                if (result?.serverError) {
                    toast.error(result.serverError)
                    return
                }
                toast.success('Levantamento salvo.')
                onClose()
                router.refresh()
            })
        }
        return (
            <Dialog
                open
                onOpenChange={(open) => {
                    if (!open) onClose()
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Novo levantamento</DialogTitle>
                        <DialogDescription>
                            Etapa {step + 1} de 4 ·{' '}
                            {
                                [
                                    'Entender o negócio',
                                    'Funcionalidades',
                                    'Regras de negócio',
                                    'Entrega e observações',
                                ][step]
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields[step].map(([name, label]) => (
                            <label key={name} className={labelClass}>
                                {label}
                                <textarea
                                    rows={3}
                                    className={fieldClass}
                                    value={values[name] ?? ''}
                                    onChange={(event) =>
                                        set(name, event.target.value)
                                    }
                                />
                            </label>
                        ))}
                    </div>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() =>
                                step > 0 ? setStep(step - 1) : onClose()
                            }
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                        >
                            {step > 0 ? 'Anterior' : 'Fechar'}
                        </button>
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Próxima etapa
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={pendingSurvey}
                                onClick={saveSurveyStep}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {pendingSurvey
                                    ? 'Salvando…'
                                    : 'Salvar levantamento'}
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    const title = `${initial?.id ? 'Editar' : 'Novo'} ${kind === 'client' ? 'cliente' : kind === 'project' ? 'projeto' : kind === 'requirement' ? 'requisito' : 'reunião'}`
    const fields: Record<
        Exclude<ModalKind, 'survey'>,
        {
            name: string
            label: string
            type?: string
            textarea?: boolean
            options?: [string, string][]
            required?: boolean
        }[]
    > = {
        client: [
            {
                name: 'name',
                label: 'Nome do cliente ou empresa',
                required: true,
            },
            { name: 'contactName', label: 'Nome do contato' },
            { name: 'email', label: 'E-mail', type: 'email' },
            { name: 'phone', label: 'Telefone', type: 'tel' },
            { name: 'notes', label: 'Observações', textarea: true },
        ],
        project: [
            { name: 'name', label: 'Nome do projeto', required: true },
            {
                name: 'clientId',
                label: 'Cliente',
                options: data.clients.map((item) => [item.id, item.name]),
            },
            {
                name: 'description',
                label: 'Descrição e objetivo',
                textarea: true,
            },
            {
                name: 'status',
                label: 'Status',
                options: Object.entries(projectStatus),
            },
            { name: 'dueDate', label: 'Prazo previsto', type: 'date' },
            { name: 'notes', label: 'Observações', textarea: true },
        ],
        requirement: [
            {
                name: 'projectId',
                label: 'Projeto',
                options: data.projects.map((item) => [item.id, item.name]),
            },
            { name: 'title', label: 'Título', required: true },
            { name: 'description', label: 'Descrição', textarea: true },
            {
                name: 'type',
                label: 'Tipo',
                options: [
                    ['FUNCTIONAL', 'Funcional'],
                    ['NON_FUNCTIONAL', 'Não funcional'],
                ],
            },
            {
                name: 'priority',
                label: 'Prioridade',
                options: Object.entries(priorityLabel),
            },
            {
                name: 'status',
                label: 'Status',
                options: Object.entries(requirementStatus),
            },
            {
                name: 'acceptanceCriteria',
                label: 'Critérios de aceitação',
                textarea: true,
            },
            { name: 'notes', label: 'Observações', textarea: true },
        ],
        meeting: [
            { name: 'title', label: 'Título ou assunto', required: true },
            {
                name: 'clientId',
                label: 'Cliente',
                options: data.clients.map((item) => [item.id, item.name]),
            },
            {
                name: 'projectId',
                label: 'Projeto (opcional)',
                options: [
                    ['', 'Sem projeto'],
                    ...projectsForClient.map(
                        (item) => [item.id, item.name] as [string, string]
                    ),
                ],
            },
            { name: 'meetingDate', label: 'Data', type: 'date' },
            { name: 'participants', label: 'Participantes' },
            { name: 'notes', label: 'Anotações', textarea: true },
            { name: 'decisions', label: 'Decisões tomadas', textarea: true },
            { name: 'nextSteps', label: 'Próximos passos', textarea: true },
        ],
    }
    const isEditing = Boolean(initial?.id)
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
        >
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Preencha as informações e salve para atualizar os dados.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        onSubmit(kind, values, initial?.id)
                    }}
                    className="grid gap-4 sm:grid-cols-2"
                >
                    {fields[kind].map((field) => (
                        <label
                            key={field.name}
                            className={`${labelClass} ${field.textarea ? 'sm:col-span-2' : ''}`}
                        >
                            {field.label}
                            {field.options ? (
                                <select
                                    required={field.required}
                                    className={fieldClass}
                                    value={values[field.name] ?? ''}
                                    onChange={(event) => {
                                        set(field.name, event.target.value)
                                        if (
                                            field.name === 'clientId' &&
                                            kind === 'meeting'
                                        )
                                            set('projectId', '')
                                    }}
                                >
                                    <option value="" disabled>
                                        Selecione…
                                    </option>
                                    {field.options.map(([value, label]) => (
                                        <option
                                            key={value || 'none'}
                                            value={value}
                                        >
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            ) : field.textarea ? (
                                <textarea
                                    rows={3}
                                    className={fieldClass}
                                    value={values[field.name] ?? ''}
                                    onChange={(event) =>
                                        set(field.name, event.target.value)
                                    }
                                />
                            ) : (
                                <input
                                    required={field.required}
                                    type={field.type ?? 'text'}
                                    className={fieldClass}
                                    value={values[field.name] ?? ''}
                                    onChange={(event) =>
                                        set(field.name, event.target.value)
                                    }
                                />
                            )}
                        </label>
                    ))}
                    <DialogFooter className="sm:col-span-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={pending}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={pending}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {pending
                                ? 'Salvando…'
                                : isEditing
                                  ? 'Salvar alterações'
                                  : 'Salvar'}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function SectionHeading({
    title,
    subtitle,
}: {
    title: string
    subtitle: string
}) {
    return (
        <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
    )
}
function EmptyState({
    title,
    description,
    action,
}: {
    title: string
    description: string
    action?: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <ClipboardList className="size-5" />
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {description}
            </p>
            {action}
        </div>
    )
}
function StatusBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            <Check className="size-3" />
            {label}
        </span>
    )
}
function RecordActions({
    edit,
    remove,
}: {
    edit: () => void
    remove: () => void
}) {
    return (
        <div className="flex gap-1">
            <button
                onClick={edit}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Editar"
            >
                <Pencil className="size-4" />
            </button>
            <button
                onClick={remove}
                className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                aria-label="Excluir"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    )
}
function TextBlock({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {title}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {text}
            </p>
        </div>
    )
}
function clientRecord(item: Client): RecordValue {
    return {
        id: item.id,
        name: item.name,
        contactName: item.contactName ?? '',
        email: item.email ?? '',
        phone: item.phone ?? '',
        notes: item.notes ?? '',
    }
}
function projectRecord(item: Project): RecordValue {
    return {
        id: item.id,
        clientId: item.clientId,
        name: item.name,
        description: item.description ?? '',
        status: item.status,
        dueDate: item.dueDate ?? '',
        notes: item.notes ?? '',
    }
}
function requirementRecord(item: ProjectRequirement): RecordValue {
    return {
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        description: item.description ?? '',
        type: item.type,
        priority: item.priority,
        status: item.status,
        acceptanceCriteria: item.acceptanceCriteria ?? '',
        notes: item.notes ?? '',
    }
}
function meetingRecord(item: Meeting): RecordValue {
    return {
        id: item.id,
        clientId: item.clientId,
        projectId: item.projectId ?? '',
        title: item.title,
        meetingDate: item.meetingDate ?? '',
        participants: item.participants ?? '',
        notes: item.notes ?? '',
        decisions: item.decisions ?? '',
        nextSteps: item.nextSteps ?? '',
    }
}
