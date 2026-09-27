'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, LogOut, Menu, Settings } from 'lucide-react'

import { items } from '@/components/layout/app-sidebar'
import { authClient } from '@/lib/auth-client'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

interface MobileNavProps {
    userName: string | null
}

/**
 * Header + drawer mobile. Só existem no mobile (o layout controla a
 * visibilidade via `md:hidden`) — no desktop a sidebar/header atuais
 * continuam exatamente como estavam.
 */
export function MobileNav({ userName }: MobileNavProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const firstName = userName?.trim().split(' ')[0] ?? null

    async function handleLogout() {
        setIsLoggingOut(true)
        await authClient.signOut()
        setOpen(false)
        router.push('/login')
        router.refresh()
    }

    return (
        <>
            <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-card px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary">
                        <div className="flex gap-1">
                            <span className="h-3 w-1 rounded-sm bg-primary-foreground" />
                            <span className="h-2 w-1 rounded-sm bg-primary-foreground" />
                        </div>
                    </div>

                    <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                        Connect Board
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {firstName && (
                        <span className="max-w-20 truncate text-sm text-muted-foreground">
                            {firstName}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-label="Abrir menu"
                        className="flex size-9 items-center justify-center rounded-lg text-foreground hover:bg-muted"
                    >
                        <Menu className="size-5" />
                    </button>
                </div>
            </header>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-72">
                    <SheetHeader className="shrink-0">
                        <SheetTitle>Connect Board</SheetTitle>
                        {userName && (
                            <p className="text-sm text-muted-foreground">
                                {userName}
                            </p>
                        )}
                    </SheetHeader>

                    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
                        {items.map((item) => {
                            const Icon = item.icon

                            const isActive =
                                pathname === item.href ||
                                (item.href !== '/' &&
                                    pathname.startsWith(item.href))

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className={[
                                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                                        isActive
                                            ? 'bg-blue-50 font-medium text-blue-600'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    ].join(' ')}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}

                        <div className="my-2 h-px bg-border" />

                        <Link
                            href="/configuracoes"
                            onClick={() => setOpen(false)}
                            className={[
                                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                                pathname === '/configuracoes'
                                    ? 'bg-blue-50 font-medium text-blue-600'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            ].join(' ')}
                        >
                            <Settings className="size-4 shrink-0" />
                            <span>Configurações</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="size-4 shrink-0 animate-spin" />
                            ) : (
                                <LogOut className="size-4 shrink-0" />
                            )}
                            <span>Sair</span>
                        </button>
                    </nav>
                </SheetContent>
            </Sheet>
        </>
    )
}
