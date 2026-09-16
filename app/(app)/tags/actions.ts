'use server'

import { headers } from 'next/headers'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { tag } from '@/db/schema/tag'
import { auth } from '@/lib/auth'

interface CreateTagInput {
    name: string
    color: string
}

interface UpdateTagInput {
    id: string
    name: string
    color: string
}

export async function createTag({ name, color }: CreateTagInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
        throw new Error('Informe o nome da tag.')
    }

    await db.insert(tag).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: trimmedName,
        color,
    })

    revalidatePath('/tags')
}

export async function updateTag({ id, name, color }: UpdateTagInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    const trimmedName = name.trim()

    if (!trimmedName) {
        throw new Error('Informe o nome da tag.')
    }

    await db
        .update(tag)
        .set({
            name: trimmedName,
            color,
            updatedAt: new Date(),
        })
        .where(and(eq(tag.id, id), eq(tag.userId, session.user.id)))

    revalidatePath('/tags')
}

export async function deleteTag(id: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado.')
    }

    await db
        .delete(tag)
        .where(and(eq(tag.id, id), eq(tag.userId, session.user.id)))

    revalidatePath('/tags')
}
