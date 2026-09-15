import { relations } from 'drizzle-orm'

import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { user } from './auth'
import { task } from './task'

export const focusSession = pgTable(
    'focus_session',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        userId: text('user_id')
            .notNull()
            .references(() => user.id, {
                onDelete: 'cascade',
            }),

        taskId: text('task_id')
            .notNull()
            .references(() => task.id, {
                onDelete: 'cascade',
            }),

        startedAt: timestamp('started_at').defaultNow().notNull(),

        endedAt: timestamp('ended_at'),

        durationSeconds: integer('duration_seconds').default(0).notNull(),

        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [
        index('focus_session_user_id_idx').on(table.userId),
        index('focus_session_task_id_idx').on(table.taskId),
        index('focus_session_started_at_idx').on(table.startedAt),
    ]
)

export const focusSessionRelations = relations(focusSession, ({ one }) => ({
    user: one(user, {
        fields: [focusSession.userId],
        references: [user.id],
    }),

    task: one(task, {
        fields: [focusSession.taskId],
        references: [task.id],
    }),
}))

export type FocusSession = typeof focusSession.$inferSelect

export type NewFocusSession = typeof focusSession.$inferInsert
