import { z } from 'zod'

const optionalText = z.string().trim().max(10000).optional()
const id = z.string().min(1)

export const clientInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cliente.').max(180),
  contactName: z.string().trim().max(180).optional(),
  email: z.union([z.literal(''), z.string().trim().email('Informe um e-mail válido.').max(254)]).optional(),
  phone: z.string().trim().max(60).optional(),
  notes: optionalText,
})

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do projeto.').max(180),
  clientId: id,
  description: optionalText,
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED']),
  dueDate: z.union([z.literal(''), z.iso.date()]).optional(),
  notes: optionalText,
})

export const surveyInputSchema = z.object({
  projectId: id,
  problem: optionalText,
  currentProcess: optionalText,
  users: optionalText,
  mainGoal: optionalText,
  neededFeatures: optionalText,
  firstVersionFeatures: optionalText,
  references: optionalText,
  integrations: optionalText,
  businessRules: optionalText,
  rolesAndPermissions: optionalText,
  approvals: optionalText,
  exceptions: optionalText,
  desiredDeadline: optionalText,
  budget: optionalText,
  successCriteria: optionalText,
  observations: optionalText,
})

export const requirementInputSchema = z.object({
  projectId: id,
  title: z.string().trim().min(1, 'Informe o título do requisito.').max(240),
  description: optionalText,
  type: z.enum(['FUNCTIONAL', 'NON_FUNCTIONAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']),
  acceptanceCriteria: optionalText,
  notes: optionalText,
})

export const meetingInputSchema = z.object({
  clientId: id,
  projectId: z.union([id, z.literal('')]).optional(),
  title: z.string().trim().min(1, 'Informe o assunto da reunião.').max(240),
  meetingDate: z.union([z.literal(''), z.iso.date()]).optional(),
  participants: optionalText,
  notes: optionalText,
  decisions: optionalText,
  nextSteps: optionalText,
})

export const recordIdSchema = z.object({ id })

export const projectShareInputSchema = z.object({ projectId: id })
