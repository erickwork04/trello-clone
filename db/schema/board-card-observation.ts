import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { board } from './board'
import { card } from './card'

export const boardCardObservation = pgTable(
    'board_card_observation',
    {
        id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
        boardId: text('board_id')
            .notNull()
            .references(() => board.id, { onDelete: 'cascade' }),
        cardId: text('card_id')
            .notNull()
            .references(() => card.id, { onDelete: 'cascade' }),
        visitorName: text('visitor_name'),
        authorTokenHash: text('author_token_hash'),
        content: text('content').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => [
        index('board_card_observation_board_created_idx').on(
            table.boardId,
            table.createdAt
        ),
        index('board_card_observation_card_created_idx').on(
            table.cardId,
            table.createdAt
        ),
    ]
)
