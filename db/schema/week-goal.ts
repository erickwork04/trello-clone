import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const weekGoal = pgTable('week_goal', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    userId: text('user_id').notNull(),

    title: text('title').notNull(),

    weekStart: timestamp('week_start').notNull(),

    completed: boolean('completed').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
