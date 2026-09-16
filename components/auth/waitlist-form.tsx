"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addToWaitlist } from "@/app/(auth)/login/_actions/waitlist";

type WaitlistFormProps = {
    onSuccess?: () => void;
};

export function WaitlistForm({ onSuccess }: WaitlistFormProps) {
    const [isPending, setIsPending] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setIsPending(true);

        try {
            const result = await addToWaitlist(formData);

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);

            setFormData({
                name: "",
                email: "",
                phone: "",
            });

            onSuccess?.();
        } catch (error) {
            console.error(error);

            toast.error("Não foi possível entrar na lista de espera.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label
                    htmlFor="waitlist-name"
                    className="text-sm font-medium"
                >
                    Nome
                </label>

                <Input
                    id="waitlist-name"
                    value={formData.name}
                    placeholder="Seu nome"
                    disabled={isPending}
                    required
                    onChange={(event) =>
                        setFormData((previous) => ({
                            ...previous,
                            name: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="waitlist-email"
                    className="text-sm font-medium"
                >
                    E-mail
                </label>

                <Input
                    id="waitlist-email"
                    type="email"
                    value={formData.email}
                    placeholder="seu@email.com"
                    disabled={isPending}
                    required
                    onChange={(event) =>
                        setFormData((previous) => ({
                            ...previous,
                            email: event.target.value,
                        }))
                    }
                />
            </div>

            <div className="space-y-2">
                <label
                    htmlFor="waitlist-phone"
                    className="text-sm font-medium"
                >
                    WhatsApp
                </label>

                <Input
                    id="waitlist-phone"
                    type="tel"
                    value={formData.phone}
                    placeholder="(83) 99999-9999"
                    disabled={isPending}
                    required
                    onChange={(event) =>
                        setFormData((previous) => ({
                            ...previous,
                            phone: event.target.value,
                        }))
                    }
                />
            </div>

            <Button
                type="submit"
                disabled={isPending}
                className="w-full cursor-pointer"
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Enviando...
                    </>
                ) : (
                    "Quero entrar na lista"
                )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                Seus dados serão usados apenas para avisar sobre a liberação do acesso.
            </p>
        </form>
    );
}