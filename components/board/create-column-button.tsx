"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumn } from "@/app/(app)/board/actions";

const schema = z.object({
  title: z
    .string()
    .min(1, "O título é obrigatório.")
    .max(80, "Deve ter no máximo 80 caracteres."),
});

type FormValues = z.infer<typeof schema>;

export function CreateColumnButton() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  });

  const { execute, isExecuting } = useAction(createColumn, {
    onSuccess: () => {
      toast.success("Coluna criada!");
      reset();
      setOpen(false);
    },
    onError: () => toast.error("Erro ao criar coluna."),
  });

  const onSubmit = (data: FormValues) => {
    execute({ title: data.title });
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex-none w-[272px] h-12 flex items-center gap-2 px-3 rounded-[var(--radius)] border border-dashed border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:border-[color:var(--primary)] hover:text-[color:var(--foreground)] transition-colors text-sm font-medium"
        aria-label="Criar nova coluna"
      >
        <Plus size={15} />
        Nova coluna
      </button>
    );
  }

  return (
    <div className="flex-none w-[272px] rounded-[var(--radius)] bg-[color:var(--card)] border border-[color:var(--border)] shadow-sm p-3 flex flex-col gap-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <Input
          {...register("title")}
          placeholder="Nome da coluna"
          autoFocus
          disabled={isExecuting}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Escape" && handleClose()}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-xs text-[color:var(--destructive)]">
            {errors.title.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isExecuting}
            className="h-7 text-xs flex-1"
          >
            {isExecuting ? "Criando..." : "Criar coluna"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleClose}
            disabled={isExecuting}
            aria-label="Cancelar"
          >
            <X size={13} />
          </Button>
        </div>
      </form>
    </div>
  );
}
