'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { tag } from '@/db/schema/tag'
import { authActionClient } from '@/lib/safe-action'
import { tagColorSchema, tagIdSchema, tagNameSchema } from '@/lib/validators/tag'

const createTagSchema = z.object({
    name: tagNameSchema,
    color: tagColorSchema,
})

const updateTagSchema = z.object({
    id: tagIdSchema,
    name: tagNameSchema,
    color: tagColorSchema,
})

const deleteTagSchema = z.object({
    id: tagIdSchema,
})

export const createTag = authActionClient
    .inputSchema(createTagSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db.insert(tag).values({
            id: crypto.randomUUID(),
            userId: ctx.user.id,
            name: parsedInput.name,
            color: parsedInput.color,
        })

        revalidatePath('/tags')
    })

export const updateTag = authActionClient
    .inputSchema(updateTagSchema)
    .action(async ({ parsedInput, ctx }) => {
        const [existing] = await db
            .select({ id: tag.id })
            .from(tag)
            .where(and(eq(tag.id, parsedInput.id), eq(tag.userId, ctx.user.id)))
            .limit(1)

        if (!existing) {
            throw new Error('Tag não encontrada.')
        }

        await db
            .update(tag)
            .set({
                name: parsedInput.name,
                color: parsedInput.color,
                updatedAt: new Date(),
            })
            .where(and(eq(tag.id, parsedInput.id), eq(tag.userId, ctx.user.id)))

        revalidatePath('/tags')
    })

export const deleteTag = authActionClient
    .inputSchema(deleteTagSchema)
    .action(async ({ parsedInput, ctx }) => {
        await db
            .delete(tag)
            .where(and(eq(tag.id, parsedInput.id), eq(tag.userId, ctx.user.id)))

        revalidatePath('/tags')
    })
