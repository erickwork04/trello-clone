import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const weekHabit = pgTable('week_habit', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    userId: text('user_id').notNull(),

    title: text('title').notNull(),

    weekStart: timestamp('week_start').notNull(),

    targetDays: integer('target_days').notNull().default(7),

    createdAt: timestamp('created_at').notNull().defaultNow(),

    updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
