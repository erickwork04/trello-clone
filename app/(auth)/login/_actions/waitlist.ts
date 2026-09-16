'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { waitlist } from '@/db/schema'

type AddToWaitlistInput = {
    name: string
    email: string
    phone: string
}

export async function addToWaitlist({
    name,
    email,
    phone,
}: AddToWaitlistInput) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!name.trim() || !normalizedEmail || !phone.trim()) {
        return {
            success: false,
            message: 'Preencha todos os campos.',
        }
    }

    const existing = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, normalizedEmail))
        .limit(1)

    if (existing.length > 0) {
        return {
            success: false,
            message: 'Este e-mail já está na lista de espera.',
        }
    }

    await db.insert(waitlist).values({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
    })

    return {
        success: true,
        message: 'Você entrou na lista de espera!',
    }
}
