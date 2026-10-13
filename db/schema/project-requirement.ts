import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { project } from './project'

export const requirementTypeEnum = pgEnum('requirement_type', [
    'FUNCTIONAL',
    'NON_FUNCTIONAL',
])
export const requirementPriorityEnum = pgEnum('requirement_priority', [
    'LOW',
    'MEDIUM',
    'HIGH',
])
export const requirementStatusEnum = pgEnum('requirement_status', [
    'REVIEW',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'REJECTED',
])

export const projectRequirement = pgTable(
    'project_requirement',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => project.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        description: text('description'),
        type: requirementTypeEnum('type').notNull().default('FUNCTIONAL'),
        priority: requirementPriorityEnum('priority')
            .notNull()
            .default('MEDIUM'),
        status: requirementStatusEnum('status').notNull().default('REVIEW'),
        acceptanceCriteria: text('acceptance_criteria'),
        notes: text('notes'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        index('project_requirement_user_id_idx').on(t.userId),
        index('project_requirement_project_id_idx').on(t.projectId),
    ]
)

export type ProjectRequirement = typeof projectRequirement.$inferSelect
