import { relations } from 'drizzle-orm'
import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'
import { card } from './card'

export const cardChecklistItem = pgTable(
    'card_checklist_item',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        cardId: text('card_id')
            .notNull()
            .references(() => card.id, { onDelete: 'cascade' }),
        title: text('title').notNull(),
        completed: boolean('completed').default(false).notNull(),
        position: integer('position').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => [
        index('card_checklist_item_card_id_idx').on(t.cardId),
    ]
)

export const cardChecklistItemRelations = relations(
    cardChecklistItem,
    ({ one }) => ({
        card: one(card, {
            fields: [cardChecklistItem.cardId],
            references: [card.id],
        }),
    })
)

export type CardChecklistItem = typeof cardChecklistItem.$inferSelect
export type NewCardChecklistItem = typeof cardChecklistItem.$inferInsert
