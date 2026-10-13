import { Link2Off } from 'lucide-react'

export default function SharedProjectNotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Link2Off className="size-6" />
                </div>
                <h1 className="mt-5 text-xl font-semibold text-foreground">Link indisponível</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Este link é inválido ou foi revogado pelo proprietário do projeto. Peça a ele um novo link de compartilhamento.
                </p>
            </section>
        </main>
    )
}
