import {
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { user } from './auth'
import { project } from './project'

export const requirementSurvey = pgTable(
    'requirement_survey',
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
        problem: text('problem'),
        currentProcess: text('current_process'),
        users: text('users'),
        mainGoal: text('main_goal'),
        neededFeatures: text('needed_features'),
        firstVersionFeatures: text('first_version_features'),
        references: text('references'),
        integrations: text('integrations'),
        businessRules: text('business_rules'),
        rolesAndPermissions: text('roles_and_permissions'),
        approvals: text('approvals'),
        exceptions: text('exceptions'),
        desiredDeadline: text('desired_deadline'),
        budget: text('budget'),
        successCriteria: text('success_criteria'),
        observations: text('observations'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        uniqueIndex('requirement_survey_project_unique').on(t.projectId),
        index('requirement_survey_user_id_idx').on(t.userId),
    ]
)

export type RequirementSurvey = typeof requirementSurvey.$inferSelect
