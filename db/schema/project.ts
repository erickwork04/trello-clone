import { date, index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { client } from './client'

export const projectStatusEnum = pgEnum('project_status', ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'])

export const project = pgTable('project', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  clientId: text('client_id').notNull().references(() => client.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('PLANNING'),
  dueDate: date('due_date', { mode: 'string' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (t) => [index('project_user_id_idx').on(t.userId), index('project_client_id_idx').on(t.clientId)])

export type Project = typeof project.$inferSelect
