import { headers } from 'next/headers'
import { and, asc, eq, ne } from 'drizzle-orm'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { AreaPage } from '@/components/dashboard/area-page'

export default async function PessoalPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    const tasks = await db
        .select()
        .from(task)
        .where(
            and(
                eq(task.userId, session.user.id),
                eq(task.area, 'PERSONAL'),
                ne(task.status, 'CANCELED')
            )
        )
        .orderBy(
            asc(task.position),
            asc(task.createdAt)
        )

    return (
        <AreaPage
            title="Pessoal"
            description="Organize compromissos e tarefas da sua vida pessoal."
            tasks={tasks.map((item) => ({
                id: item.id,
                title: item.title,
                area: 'Pessoal',
                completed: item.status === 'DONE',
                topPriority: item.isTopPriority,
            }))}
        />
    )
}