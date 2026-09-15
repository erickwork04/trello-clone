'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'

interface CreateWeekTaskInput {
    title: string

    area: 'WORK' | 'STUDIES' | 'PERSONAL'

    plannedDate: string
}

export async function createWeekTask(input: CreateWeekTaskInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    if (!input.title.trim()) {
        throw new Error('O título da tarefa é obrigatório')
    }

    const [year, month, day] = input.plannedDate.split('-').map(Number)

    const plannedDate = new Date(year, month - 1, day)

    plannedDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const isToday = plannedDate.getTime() === today.getTime()

    await db.insert(task).values({
        userId: session.user.id,
        title: input.title.trim(),
        area: input.area,
        priority: 'MEDIUM',
        status: isToday ? 'TODAY' : 'WEEK',
        plannedDate,
    })

    revalidatePath('/semana')
    revalidatePath('/hoje')
}
