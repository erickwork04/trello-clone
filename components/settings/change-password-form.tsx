'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Informe sua senha atual.'),
        newPassword: z
            .string()
            .min(8, 'A nova senha deve ter pelo menos 8 caracteres.'),
        confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'As senhas não coincidem.',
        path: ['confirmPassword'],
    })

type PasswordForm = z.infer<typeof passwordSchema>

export function ChangePasswordForm() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    })

    async function onSubmit(data: PasswordForm) {
        setIsSubmitting(true)

        const { error } = await authClient.changePassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
            revokeOtherSessions: false,
        })

        setIsSubmitting(false)

        if (error) {
            toast.error(error.message ?? 'Erro ao alterar a senha.')
            return
        }

        toast.success('Senha alterada.')
        reset()
        setOpen(false)
    }

    if (!open) {
        return (
            <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(true)}
            >
                Alterar senha
            </Button>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    {...register('currentPassword')}
                />
                {errors.currentPassword && (
                    <p className="text-xs text-red-600">
                        {errors.currentPassword.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    {...register('newPassword')}
                />
                {errors.newPassword && (
                    <p className="text-xs text-red-600">
                        {errors.newPassword.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                    <p className="text-xs text-red-600">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setOpen(false)
                        reset()
                    }}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    {isSubmitting && (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                    )}
                    Confirmar nova senha
                </Button>
            </div>
        </form>
    )
}
