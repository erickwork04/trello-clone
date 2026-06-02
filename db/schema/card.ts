import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { boardColumn } from './column'

export const card = pgTable(
    'card',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        columnId: text('column_id')
            .notNull()
            .references(() => boardColumn.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        position: integer('position').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [index('card_column_id_idx').on(t.columnId)]
)

export const cardRelations = relations(card, ({ one }) => ({
    column: one(boardColumn, {
        fields: [card.columnId],
        references: [boardColumn.id],
    }),
}))

export type Card = typeof card.$inferSelect
export type NewCard = typeof card.$inferInsert
