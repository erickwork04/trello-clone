import { headers } from 'next/headers'
import { asc, eq, and } from 'drizzle-orm'
import { Inbox } from 'lucide-react'

import { auth } from '@/lib/auth'
import { db } from '@/db'
import { task } from '@/db/schema/task'
import { InboxTaskActions } from '@/components/dashboard/inbox-task-actions'

export default async function InboxPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    const inboxTasks = await db
        .select()
        .from(task)
        .where(
            and(
                eq(task.userId, session.user.id),
                eq(task.area, 'INBOX')
            )
        )
        .orderBy(
            asc(task.position),
            asc(task.createdAt)
        )

    return (
        <div className="h-full overflow-y-auto">
            <div className="w-full px-8 py-6 2xl:px-10">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <Inbox className="size-7 text-blue-600" />

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Caixa de Entrada
                        </h1>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                        Capture rapidamente o que precisa lembrar.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {inboxTasks.length > 0 ? (
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                            {inboxTasks.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-4"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-slate-900">
                                            {item.title}
                                        </p>

                                        {item.description && (
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            Inbox
                                        </span>

                                        <InboxTaskActions taskId={item.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
                            <p className="text-sm text-slate-500">
                                Sua Caixa de Entrada está vazia.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}