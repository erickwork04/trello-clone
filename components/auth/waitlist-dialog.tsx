"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WaitlistForm } from "@/components/auth/waitlist-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type WaitlistDialogProps = {
    triggerText?: string;
    variant?: "link" | "button";
};

export function WaitlistDialog({
    triggerText = "Criar conta",
    variant = "link",
}: WaitlistDialogProps) {
    const [open, setOpen] = useState(false);
    const [showForm, setShowForm] = useState(false);

    function handleOpenChange(value: boolean) {
        setOpen(value);

        if (!value) {
            setShowForm(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {variant === "button" ? (
                    <Button
                        type="button"
                        className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {triggerText}
                    </Button>
                ) : (
                    <button
                        type="button"
                        className="font-medium text-primary cursor-pointer transition-colors hover:text-primary/80"
                    >
                        {triggerText}
                    </button>
                )}
            </DialogTrigger>

            <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
                {!showForm ? (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-center">
                                Novos cadastros em breve 🚀
                            </DialogTitle>

                            <DialogDescription className="text-center">
                                O Connect Board ainda não está liberado para novos usuários.
                                Estamos preparando tudo para abrir os cadastros em breve.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <Button
                                type="button"
                                className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => setShowForm(true)}
                            >
                                Entrar na lista de espera
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full cursor-pointer border-border bg-background text-foreground hover:bg-accent"
                                onClick={() => setOpen(false)}
                            >
                                Entendi
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader className="text-center">
                            <DialogTitle className="text-center">
                                Lista de espera
                            </DialogTitle>

                            <DialogDescription className="text-center">
                                Deixe seus dados e avisaremos quando os novos cadastros forem
                                liberados.
                            </DialogDescription>
                        </DialogHeader>

                        <WaitlistForm onSuccess={() => setOpen(false)} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}