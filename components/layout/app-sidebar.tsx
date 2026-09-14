'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    CalendarDays,
    Inbox,
    BriefcaseBusiness,
    GraduationCap,
    UserRound,
    CircleCheckBig,
} from 'lucide-react'

const items = [
    {
        label: 'Hoje',
        href: '/hoje',
        icon: Home,
    },
    {
        label: 'Minha Semana',
        href: '/semana',
        icon: CalendarDays,
    },
    {
        label: 'Caixa de Entrada',
        href: '/inbox',
        icon: Inbox,
    },
    {
        label: 'Trabalho',
        href: '/board',
        icon: BriefcaseBusiness,
    },
    {
        label: 'Estudos',
        href: '/estudos',
        icon: GraduationCap,
    },
    {
        label: 'Pessoal',
        href: '/pessoal',
        icon: UserRound,
    },
    {
        label: 'Concluídas',
        href: '/concluidas',
        icon: CircleCheckBig,
    },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden h-screen w-64 shrink-0 border-r border-[color:var(--border)] bg-[color:var(--card)] md:flex md:flex-col">
            <div className="flex h-16 items-center border-b border-[color:var(--border)] px-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[color:var(--primary)]">
                        <div className="flex gap-1">
                            <span className="h-4 w-1.5 rounded-sm bg-[color:var(--primary-foreground)]" />
                            <span className="h-3 w-1.5 rounded-sm bg-[color:var(--primary-foreground)]" />
                        </div>
                    </div>

                    <span className="font-semibold tracking-tight text-[color:var(--foreground)]">
                        Meu Board
                    </span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {items.map((item) => {
                    const Icon = item.icon

                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={[
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                                isActive
                                    ? 'bg-blue-50 font-medium text-blue-600'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            ].join(' ')}
                        >
                            <Icon className="size-4" />

                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4">
                <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs leading-5 text-blue-700">
                        Pequenos passos também são progresso.
                    </p>
                </div>
            </div>
        </aside>
    )
}