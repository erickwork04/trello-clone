import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'

import { auth } from '@/lib/auth'
import { UpdateNameForm } from '@/components/settings/update-name-form'
import { ChangePasswordForm } from '@/components/settings/change-password-form'

export default async function ConfiguracoesPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="h-full overflow-y-auto bg-[#fbfcff]">
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">

                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                        <Settings className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Configurações
                        </h1>
                        <p className="text-sm text-slate-500">
                            Gerencie os dados básicos da sua conta.
                        </p>
                    </div>
                </div>

                <div className="mt-8 space-y-6">

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Perfil
                        </h2>

                        <div className="mt-4 space-y-4">
                            <UpdateNameForm currentName={session.user.name} />

                            <div className="space-y-1.5 border-t border-slate-100 pt-4">
                                <p className="text-xs font-medium text-slate-400">
                                    E-mail
                                </p>
                                <p className="text-sm text-slate-600">
                                    {session.user.email}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Segurança
                        </h2>

                        <div className="mt-4">
                            <p className="mb-3 text-sm text-slate-500">
                                Senha
                            </p>
                            <ChangePasswordForm />
                        </div>
                    </section>

                </div>

            </div>
        </div>
    )
}
