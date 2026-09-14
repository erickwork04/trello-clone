import { relations } from 'drizzle-orm'

import {
    boolean,
    date,
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

export const taskAreaEnum = pgEnum('task_area', [
    'WORK',
    'STUDIES',
    'PERSONAL',
    'INBOX',
])

export const taskStatusEnum = pgEnum('task_status', [
    'BACKLOG',
    'WEEK',
    'TODAY',
    'DOING',
    'DONE',
    'CANCELED',
])

export const taskPriorityEnum = pgEnum('task_priority', [
    'LOW',
    'MEDIUM',
    'HIGH',
])

export const task = pgTable(
    'task',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        userId: text('user_id')
            .notNull()
            .references(() => user.id, {
                onDelete: 'cascade',
            }),

        title: text('title').notNull(),

        description: text('description'),

        area: taskAreaEnum('area').notNull().default('INBOX'),

        status: taskStatusEnum('status').notNull().default('BACKLOG'),

        priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),

        plannedDate: date('planned_date', {
            mode: 'date',
        }),

        dueDate: date('due_date', {
            mode: 'date',
        }),

        estimatedMinutes: integer('estimated_minutes'),

        isTopPriority: boolean('is_top_priority').default(false).notNull(),

        position: integer('position').default(0).notNull(),

        completedAt: timestamp('completed_at'),

        createdAt: timestamp('created_at').defaultNow().notNull(),

        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index('task_user_id_idx').on(table.userId),

        index('task_status_idx').on(table.status),

        index('task_planned_date_idx').on(table.plannedDate),
    ]
)

export const taskRelations = relations(task, ({ one }) => ({
    user: one(user, {
        fields: [task.userId],
        references: [user.id],
    }),
}))

export type Task = typeof task.$inferSelect
export type NewTask = typeof task.$inferInsert
