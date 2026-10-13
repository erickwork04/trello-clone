import { relations } from 'drizzle-orm'
import {
    date,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { boardColumn } from './column'
import { projectRequirement } from './project-requirement'

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
        description: text('description'),
        requirementId: text('requirement_id').references(
            () => projectRequirement.id,
            { onDelete: 'cascade' }
        ),
        dueDate: date('due_date', {
            mode: 'date',
        }),
        position: integer('position').notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at')
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (t) => [
        index('card_column_id_idx').on(t.columnId),
        uniqueIndex('card_requirement_id_unique').on(t.requirementId),
    ]
)

export const cardRelations = relations(card, ({ one }) => ({
    column: one(boardColumn, {
        fields: [card.columnId],
        references: [boardColumn.id],
    }),
}))

export type Card = typeof card.$inferSelect
export type NewCard = typeof card.$inferInsert
