import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const tag = pgTable('tag', {
    id: text('id').primaryKey(),

    userId: text('user_id')
        .notNull()
        .references(() => user.id, {
            onDelete: 'cascade',
        }),

    name: text('name').notNull(),

    color: text('color').notNull().default('blue'),

    createdAt: timestamp('created_at').notNull().defaultNow(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
