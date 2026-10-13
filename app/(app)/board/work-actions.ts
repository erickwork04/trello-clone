'use server'

import { revalidatePath } from 'next/cache'
import { and, asc, eq, inArray, max, ne } from 'drizzle-orm'
import { db } from '@/db'
import { authActionClient } from '@/lib/safe-action'
import {
    clientInputSchema,
    meetingInputSchema,
    projectInputSchema,
    recordIdSchema,
    requirementInputSchema,
    surveyInputSchema,
} from '@/lib/validators/work'
import { client } from '@/db/schema/client'
import { project } from '@/db/schema/project'
import { requirementSurvey } from '@/db/schema/requirement-survey'
import { projectRequirement } from '@/db/schema/project-requirement'
import { meeting } from '@/db/schema/meeting'
import { board } from '@/db/schema/board'
import { boardColumn } from '@/db/schema/column'
import { card } from '@/db/schema/card'
import { projectShare } from '@/db/schema/project-share'
import {
    createProjectShareToken,
    decryptProjectShareToken,
    encryptProjectShareToken,
    hashProjectShareToken,
} from '@/lib/project-share-token'
import { projectShareInputSchema } from '@/lib/validators/work'

const clean = (value?: string) => value?.trim() || null
const refresh = () => revalidatePath('/board')

class ProjectDeletionError extends Error {}

async function ownedClient(id: string, userId: string) {
    const [row] = await db
        .select({ id: client.id })
        .from(client)
        .where(and(eq(client.id, id), eq(client.userId, userId)))
        .limit(1)
    return row
}

async function ownedProject(id: string, userId: string) {
    const [row] = await db
        .select({ id: project.id, clientId: project.clientId })
        .from(project)
        .where(and(eq(project.id, id), eq(project.userId, userId)))
        .limit(1)
    return row
}

export const saveClient = authActionClient
    .inputSchema(
        clientInputSchema.extend({ id: recordIdSchema.shape.id.optional() })
    )
    .action(async ({ parsedInput, ctx }) => {
        const values = {
            name: parsedInput.name,
            contactName: clean(parsedInput.contactName),
            email: clean(parsedInput.email),
            phone: clean(parsedInput.phone),
            notes: clean(parsedInput.notes),
        }
        if (parsedInput.id) {
            const owned = await ownedClient(parsedInput.id, ctx.user.id)
            if (!owned) throw new Error('Cliente não encontrado.')
            await db
                .update(client)
                .set(values)
                .where(
                    and(
                        eq(client.id, parsedInput.id),
                        eq(client.userId, ctx.user.id)
                    )
                )
        } else {
            await db.insert(client).values({ ...values, userId: ctx.user.id })
        }
        refresh()
    })

export const deleteClient = authActionClient
    .inputSchema(recordIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const owned = await ownedClient(parsedInput.id, ctx.user.id)
        if (!owned) throw new Error('Cliente não encontrado.')
        const [linkedProject] = await db
            .select({ id: project.id })
            .from(project)
            .where(
                and(
                    eq(project.clientId, owned.id),
                    eq(project.userId, ctx.user.id)
                )
            )
            .limit(1)
        const [linkedMeeting] = await db
            .select({ id: meeting.id })
            .from(meeting)
            .where(
                and(
                    eq(meeting.clientId, owned.id),
                    eq(meeting.userId, ctx.user.id)
                )
            )
            .limit(1)
        if (linkedProject || linkedMeeting)
            throw new Error(
                'Este cliente possui projetos ou reuniões. Remova ou transfira esses registros antes de excluir o cliente.'
            )
        await db
            .delete(client)
            .where(and(eq(client.id, owned.id), eq(client.userId, ctx.user.id)))
        refresh()
    })

export const saveProject = authActionClient
    .inputSchema(
        projectInputSchema.extend({ id: recordIdSchema.shape.id.optional() })
    )
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedClient(parsedInput.clientId, ctx.user.id)))
            throw new Error('Cliente não encontrado.')
        const values = {
            clientId: parsedInput.clientId,
            name: parsedInput.name,
            description: clean(parsedInput.description),
            status: parsedInput.status,
            dueDate: clean(parsedInput.dueDate),
            notes: clean(parsedInput.notes),
        }
        if (parsedInput.id) {
            if (!(await ownedProject(parsedInput.id, ctx.user.id)))
                throw new Error('Projeto não encontrado.')
            await db
                .update(project)
                .set(values)
                .where(
                    and(
                        eq(project.id, parsedInput.id),
                        eq(project.userId, ctx.user.id)
                    )
                )
        } else
            await db.insert(project).values({ ...values, userId: ctx.user.id })
        refresh()
    })

export const deleteProject = authActionClient
    .inputSchema(recordIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        let result: {
            clientHasOtherProjects: boolean
            preservedClientMeetings: number
        }
        try {
            result = await db.transaction(async (tx) => {
                const [owned] = await tx
                    .select({ id: project.id, clientId: project.clientId })
                    .from(project)
                    .where(
                        and(
                            eq(project.id, parsedInput.id),
                            eq(project.userId, ctx.user.id)
                        )
                    )
                    .for('update')
                    .limit(1)

                if (!owned)
                    throw new ProjectDeletionError(
                        'Projeto não encontrado ou sem autorização para excluí-lo.'
                    )

                const [ownedClientRow] = await tx
                    .select({ id: client.id })
                    .from(client)
                    .where(
                        and(
                            eq(client.id, owned.clientId),
                            eq(client.userId, ctx.user.id)
                        )
                    )
                    .limit(1)

                if (!ownedClientRow)
                    throw new ProjectDeletionError(
                        'O cliente vinculado ao projeto não pertence ao usuário autenticado.'
                    )

                const [otherProject] = await tx
                    .select({ id: project.id })
                    .from(project)
                    .where(
                        and(
                            eq(project.clientId, owned.clientId),
                            eq(project.userId, ctx.user.id),
                            ne(project.id, owned.id)
                        )
                    )
                    .limit(1)

                const linkedSurveys = await tx
                    .select({
                        id: requirementSurvey.id,
                        userId: requirementSurvey.userId,
                    })
                    .from(requirementSurvey)
                    .where(eq(requirementSurvey.projectId, owned.id))

                const linkedRequirements = await tx
                    .select({
                        id: projectRequirement.id,
                        userId: projectRequirement.userId,
                    })
                    .from(projectRequirement)
                    .where(eq(projectRequirement.projectId, owned.id))

                const linkedMeetings = await tx
                    .select({ id: meeting.id, userId: meeting.userId })
                    .from(meeting)
                    .where(eq(meeting.projectId, owned.id))

                if (
                    linkedSurveys.some((item) => item.userId !== ctx.user.id) ||
                    linkedRequirements.some(
                        (item) => item.userId !== ctx.user.id
                    ) ||
                    linkedMeetings.some((item) => item.userId !== ctx.user.id)
                ) {
                    throw new ProjectDeletionError(
                        'Há registros vinculados que não pertencem ao usuário autenticado. Nenhum dado foi excluído.'
                    )
                }

                const requirementIds = linkedRequirements.map((item) => item.id)
                const linkedCards =
                    requirementIds.length > 0
                        ? await tx
                              .select({
                                  id: card.id,
                                  boardUserId: board.userId,
                              })
                              .from(card)
                              .innerJoin(
                                  boardColumn,
                                  eq(card.columnId, boardColumn.id)
                              )
                              .innerJoin(
                                  board,
                                  eq(boardColumn.boardId, board.id)
                              )
                              .where(
                                  inArray(card.requirementId, requirementIds)
                              )
                        : []

                if (
                    linkedCards.some((item) => item.boardUserId !== ctx.user.id)
                ) {
                    throw new ProjectDeletionError(
                        'Há cards vinculados em um quadro de outro usuário. Nenhum dado foi excluído.'
                    )
                }

                // As FKs em cascata removem levantamento, requisitos, reuniões, cards e filhos dos cards.
                await tx
                    .delete(project)
                    .where(
                        and(
                            eq(project.id, owned.id),
                            eq(project.userId, ctx.user.id)
                        )
                    )

                // O cadastro do cliente e reuniões vinculadas a outros projetos (ou sem projeto) são preservados.
                const remainingClientMeetings = await tx
                    .select({ id: meeting.id })
                    .from(meeting)
                    .where(
                        and(
                            eq(meeting.clientId, owned.clientId),
                            eq(meeting.userId, ctx.user.id)
                        )
                    )

                return {
                    clientHasOtherProjects: Boolean(otherProject),
                    preservedClientMeetings: remainingClientMeetings.length,
                }
            })
        } catch (error) {
            if (error instanceof ProjectDeletionError) throw error
            throw new Error(
                'Não foi possível excluir o projeto. A transação foi revertida e nenhum registro foi removido. Tente novamente.'
            )
        }

        refresh()
        return result
    })

export const getProjectShare = authActionClient
    .inputSchema(projectShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedProject(parsedInput.projectId, ctx.user.id)))
            throw new Error('Projeto não encontrado ou sem autorização.')

        const [share] = await db
            .select({
                isActive: projectShare.isActive,
                encryptedToken: projectShare.encryptedToken,
            })
            .from(projectShare)
            .where(eq(projectShare.projectId, parsedInput.projectId))
            .limit(1)

        if (!share?.isActive || !share.encryptedToken)
            return { isActive: false, path: null }

        return {
            isActive: true,
            path: `/share/${decryptProjectShareToken(share.encryptedToken)}`,
        }
    })

export const activateProjectShare = authActionClient
    .inputSchema(projectShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        const path = await db.transaction(async (tx) => {
            const [owned] = await tx
                .select({ id: project.id })
                .from(project)
                .where(
                    and(
                        eq(project.id, parsedInput.projectId),
                        eq(project.userId, ctx.user.id)
                    )
                )
                .for('update')
                .limit(1)

            if (!owned)
                throw new Error('Projeto não encontrado ou sem autorização.')

            const [existing] = await tx
                .select()
                .from(projectShare)
                .where(eq(projectShare.projectId, owned.id))
                .for('update')
                .limit(1)

            if (existing?.isActive && existing.encryptedToken)
                return `/share/${decryptProjectShareToken(existing.encryptedToken)}`

            const token = createProjectShareToken()
            const values = {
                projectId: owned.id,
                tokenHash: hashProjectShareToken(token),
                encryptedToken: encryptProjectShareToken(token),
                isActive: true,
                updatedAt: new Date(),
                revokedAt: null,
            }

            if (existing)
                await tx
                    .update(projectShare)
                    .set(values)
                    .where(eq(projectShare.projectId, owned.id))
            else await tx.insert(projectShare).values(values)

            return `/share/${token}`
        })

        refresh()
        return { path }
    })

export const revokeProjectShare = authActionClient
    .inputSchema(projectShareInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedProject(parsedInput.projectId, ctx.user.id)))
            throw new Error('Projeto não encontrado ou sem autorização.')

        await db
            .update(projectShare)
            .set({
                isActive: false,
                encryptedToken: null,
                updatedAt: new Date(),
                revokedAt: new Date(),
            })
            .where(eq(projectShare.projectId, parsedInput.projectId))

        refresh()
        return { isActive: false }
    })

export const saveSurvey = authActionClient
    .inputSchema(surveyInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        const owned = await ownedProject(parsedInput.projectId, ctx.user.id)
        if (!owned) throw new Error('Projeto não encontrado.')
        const { projectId, ...answers } = parsedInput
        const values = Object.fromEntries(
            Object.entries(answers).map(([key, value]) => [key, clean(value)])
        )
        const [existing] = await db
            .select({ id: requirementSurvey.id })
            .from(requirementSurvey)
            .where(
                and(
                    eq(requirementSurvey.projectId, projectId),
                    eq(requirementSurvey.userId, ctx.user.id)
                )
            )
            .limit(1)
        if (existing)
            await db
                .update(requirementSurvey)
                .set(values)
                .where(
                    and(
                        eq(requirementSurvey.id, existing.id),
                        eq(requirementSurvey.userId, ctx.user.id)
                    )
                )
        else
            await db
                .insert(requirementSurvey)
                .values({ ...values, projectId, userId: ctx.user.id })
        refresh()
    })

export const saveRequirement = authActionClient
    .inputSchema(
        requirementInputSchema.extend({
            id: recordIdSchema.shape.id.optional(),
        })
    )
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedProject(parsedInput.projectId, ctx.user.id)))
            throw new Error('Projeto não encontrado.')
        const { id, projectId, ...input } = parsedInput
        const values = {
            projectId,
            title: input.title,
            description: clean(input.description),
            type: input.type,
            priority: input.priority,
            status: input.status,
            acceptanceCriteria: clean(input.acceptanceCriteria),
            notes: clean(input.notes),
        }
        if (id) {
            const [owned] = await db
                .select({ id: projectRequirement.id })
                .from(projectRequirement)
                .where(
                    and(
                        eq(projectRequirement.id, id),
                        eq(projectRequirement.userId, ctx.user.id)
                    )
                )
                .limit(1)
            if (!owned) throw new Error('Requisito não encontrado.')
            await db
                .update(projectRequirement)
                .set(values)
                .where(
                    and(
                        eq(projectRequirement.id, id),
                        eq(projectRequirement.userId, ctx.user.id)
                    )
                )
        } else
            await db
                .insert(projectRequirement)
                .values({ ...values, userId: ctx.user.id })
        refresh()
    })

export const deleteRequirement = authActionClient
    .inputSchema(recordIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [owned] = await db
            .select({ id: projectRequirement.id })
            .from(projectRequirement)
            .where(
                and(
                    eq(projectRequirement.id, parsedInput.id),
                    eq(projectRequirement.userId, ctx.user.id)
                )
            )
            .limit(1)
        if (!owned) throw new Error('Requisito não encontrado.')
        const [linkedTask] = await db
            .select({ id: card.id })
            .from(card)
            .where(eq(card.requirementId, owned.id))
            .limit(1)
        if (linkedTask)
            throw new Error(
                'Este requisito está vinculado a uma tarefa do Kanban. Exclua o card antes de remover o requisito.'
            )
        await db
            .delete(projectRequirement)
            .where(
                and(
                    eq(projectRequirement.id, owned.id),
                    eq(projectRequirement.userId, ctx.user.id)
                )
            )
        refresh()
    })

export const convertRequirementToTask = authActionClient
    .inputSchema(recordIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [owned] = await db
            .select({ requirement: projectRequirement })
            .from(projectRequirement)
            .innerJoin(project, eq(projectRequirement.projectId, project.id))
            .where(
                and(
                    eq(projectRequirement.id, parsedInput.id),
                    eq(projectRequirement.userId, ctx.user.id),
                    eq(project.userId, ctx.user.id)
                )
            )
            .limit(1)
        if (!owned) throw new Error('Requisito não encontrado.')
        const requirement = owned.requirement
        if (requirement.status !== 'APPROVED')
            throw new Error('Apenas requisitos aprovados podem virar tarefas.')
        const [existing] = await db
            .select({ id: card.id })
            .from(card)
            .where(eq(card.requirementId, requirement.id))
            .limit(1)
        if (existing)
            throw new Error(
                'Este requisito já está vinculado a uma tarefa do Kanban.'
            )
        const [userBoard] = await db
            .select({ id: board.id })
            .from(board)
            .where(eq(board.userId, ctx.user.id))
            .limit(1)
        if (!userBoard) throw new Error('Quadro não encontrado.')
        const columns = await db
            .select()
            .from(boardColumn)
            .where(eq(boardColumn.boardId, userBoard.id))
            .orderBy(asc(boardColumn.position))
        const target = columns.find((column) => column.type !== 'DONE')
        if (!target)
            throw new Error(
                'Crie uma coluna aberta no Kanban antes de transformar o requisito em tarefa.'
            )
        const [position] = await db
            .select({ max: max(card.position) })
            .from(card)
            .where(eq(card.columnId, target.id))
        const description =
            [
                requirement.description,
                requirement.acceptanceCriteria
                    ? `Critérios de aceitação:\n${requirement.acceptanceCriteria}`
                    : null,
            ]
                .filter(Boolean)
                .join('\n\n') || null
        await db.insert(card).values({
            columnId: target.id,
            name: requirement.title,
            description,
            requirementId: requirement.id,
            position: (position?.max ?? -1) + 1,
        })
        revalidatePath('/board')
    })

export const saveMeeting = authActionClient
    .inputSchema(
        meetingInputSchema.extend({ id: recordIdSchema.shape.id.optional() })
    )
    .action(async ({ parsedInput, ctx }) => {
        if (!(await ownedClient(parsedInput.clientId, ctx.user.id)))
            throw new Error('Cliente não encontrado.')
        const projectId = clean(parsedInput.projectId)
        if (projectId) {
            const owned = await ownedProject(projectId, ctx.user.id)
            if (!owned || owned.clientId !== parsedInput.clientId)
                throw new Error(
                    'O projeto selecionado não pertence ao cliente informado.'
                )
        }
        const values = {
            clientId: parsedInput.clientId,
            projectId,
            title: parsedInput.title,
            meetingDate: clean(parsedInput.meetingDate),
            participants: clean(parsedInput.participants),
            notes: clean(parsedInput.notes),
            decisions: clean(parsedInput.decisions),
            nextSteps: clean(parsedInput.nextSteps),
        }
        if (parsedInput.id) {
            const [owned] = await db
                .select({ id: meeting.id })
                .from(meeting)
                .where(
                    and(
                        eq(meeting.id, parsedInput.id),
                        eq(meeting.userId, ctx.user.id)
                    )
                )
                .limit(1)
            if (!owned) throw new Error('Reunião não encontrada.')
            await db
                .update(meeting)
                .set(values)
                .where(
                    and(
                        eq(meeting.id, owned.id),
                        eq(meeting.userId, ctx.user.id)
                    )
                )
        } else
            await db.insert(meeting).values({ ...values, userId: ctx.user.id })
        refresh()
    })

export const deleteMeeting = authActionClient
    .inputSchema(recordIdSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [owned] = await db
            .select({ id: meeting.id })
            .from(meeting)
            .where(
                and(
                    eq(meeting.id, parsedInput.id),
                    eq(meeting.userId, ctx.user.id)
                )
            )
            .limit(1)
        if (!owned) throw new Error('Reunião não encontrada.')
        await db
            .delete(meeting)
            .where(
                and(eq(meeting.id, owned.id), eq(meeting.userId, ctx.user.id))
            )
        refresh()
    })
