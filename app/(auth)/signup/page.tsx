import Link from "next/link";

import { WaitlistDialog } from "@/components/auth/waitlist-dialog";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Novos cadastros em breve
          </h1>

          <p className="text-sm leading-6 text-muted-foreground">
            O Meu Board ainda não está liberado para novos usuários.
            Estamos preparando tudo para abrir os cadastros em breve.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <WaitlistDialog
            triggerText="Entrar na lista de espera"
            variant="button"
          />

          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link href="/login">
              Já tenho uma conta
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}