import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { project } from './project'

export const projectShare = pgTable('project_share', {
    projectId: text('project_id')
        .primaryKey()
        .references(() => project.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    encryptedToken: text('encrypted_token'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    revokedAt: timestamp('revoked_at'),
})
