'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const nameSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Informe seu nome.')
        .max(100, 'O nome deve ter no máximo 100 caracteres.'),
})

type NameForm = z.infer<typeof nameSchema>

interface UpdateNameFormProps {
    currentName: string
}

export function UpdateNameForm({ currentName }: UpdateNameFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<NameForm>({
        resolver: zodResolver(nameSchema),
        defaultValues: { name: currentName },
    })

    async function onSubmit(data: NameForm) {
        setIsSubmitting(true)

        const { error } = await authClient.updateUser({ name: data.name })

        setIsSubmitting(false)

        if (error) {
            toast.error(error.message ?? 'Erro ao atualizar o nome.')
            return
        }

        toast.success('Nome atualizado.')

        // A sessão é lida no Server Component do layout (app/(app)/layout.tsx)
        // — refresh recarrega os dados do servidor e reflete o novo nome
        // em toda a UI (sidebar mobile incluída), sem request extra manual.
        router.refresh()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
                <Label htmlFor="settings-name">Nome</Label>
                <Input id="settings-name" {...register('name')} />
                {errors.name && (
                    <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
            </div>

            <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="bg-blue-600 text-white hover:bg-blue-700"
            >
                {isSubmitting && (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                )}
                Salvar alterações
            </Button>
        </form>
    )
}
