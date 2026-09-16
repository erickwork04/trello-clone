'use server'

import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema'

export async function deleteTask(taskId: string) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    await db.delete(task).where(eq(task.id, taskId))

    revalidatePath('/hoje')
    revalidatePath('/semana')
    revalidatePath('/inbox')
    revalidatePath('/estudos')
    revalidatePath('/pessoal')
}
