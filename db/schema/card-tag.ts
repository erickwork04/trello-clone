import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core'

import { card } from './card'
import { tag } from './tag'

export const cardTag = pgTable(
    'card_tag',
    {
        cardId: text('card_id')
            .notNull()
            .references(() => card.id, {
                onDelete: 'cascade',
            }),

        tagId: text('tag_id')
            .notNull()
            .references(() => tag.id, {
                onDelete: 'cascade',
            }),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.cardId, table.tagId],
        }),
    })
)
