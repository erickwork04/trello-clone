import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { weekHabit } from './week-habit'

export const weekHabitCheck = pgTable('week_habit_check', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),

    habitId: text('habit_id')
        .notNull()
        .references(() => weekHabit.id, {
            onDelete: 'cascade',
        }),

    date: timestamp('date').notNull(),

    completed: boolean('completed').notNull().default(false),

    createdAt: timestamp('created_at').notNull().defaultNow(),
})
