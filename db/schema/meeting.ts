import { date, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { client } from './client'
import { project } from './project'

export const meeting = pgTable(
    'meeting',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        clientId: text('client_id')
            .notNull()
            .references(() => client.id, { onDelete: 'restrict' }),
        projectId: text('project_id').references(() => project.id, {
            onDelete: 'cascade',
        }),
        title: text('title').notNull(),
        meetingDate: date('meeting_date', { mode: 'string' }),
        participants: text('participants'),
        notes: text('notes'),
        decisions: text('decisions'),
        nextSteps: text('next_steps'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        index('meeting_user_id_idx').on(t.userId),
        index('meeting_client_id_idx').on(t.clientId),
        index('meeting_project_id_idx').on(t.projectId),
    ]
)

export type Meeting = typeof meeting.$inferSelect
