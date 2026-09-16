import { pgTable, text, primaryKey } from 'drizzle-orm/pg-core'

import { task } from './task'
import { tag } from './tag'

export const taskTag = pgTable(
    'task_tag',
    {
        taskId: text('task_id')
            .notNull()
            .references(() => task.id, {
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
            columns: [table.taskId, table.tagId],
        }),
    })
)
