'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'

interface CreateTaskInput {
    title: string
    destination: 'TODAY' | 'INBOX'
    area?: 'WORK' | 'STUDIES' | 'PERSONAL'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    plannedDate?: string
}

export async function createTask(input: CreateTaskInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error('Não autorizado')
    }

    if (!input.title.trim()) {
        throw new Error('O título da tarefa é obrigatório')
    }

    if (input.destination === 'INBOX') {
        await db.insert(task).values({
            userId: session.user.id,
            title: input.title.trim(),
            area: 'INBOX',
            status: 'BACKLOG',
            priority: 'MEDIUM',
            plannedDate: null,
        })

        revalidatePath('/hoje')
        revalidatePath('/inbox')

        return
    }

    if (!input.area || !input.priority || !input.plannedDate) {
        throw new Error('Preencha os dados da tarefa')
    }

    const [year, month, day] = input.plannedDate.split('-').map(Number)

    const plannedDate = new Date(year, month - 1, day)

    const today = new Date()

    today.setHours(0, 0, 0, 0)
    plannedDate.setHours(0, 0, 0, 0)

    const isToday = plannedDate.getTime() === today.getTime()

    await db.insert(task).values({
        userId: session.user.id,
        title: input.title.trim(),
        area: input.area,
        priority: input.priority,
        status: isToday ? 'TODAY' : 'WEEK',
        plannedDate,
    })

    revalidatePath('/hoje')
    revalidatePath('/semana')
}
