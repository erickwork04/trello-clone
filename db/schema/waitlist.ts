import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const waitlist = pgTable('waitlist', {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),

    email: text('email').notNull().unique(),

    phone: text('phone').notNull(),

    createdAt: timestamp('created_at', {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
})
