"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GripVertical, Palette, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { updateColumn, deleteColumn } from "@/app/(app)/board/actions";
import { BoardColumn } from "@/db/schema/column";
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  COLUMN_COLOR_TOKENS,
  ColumnColorToken,
  columnTitleSchema,
} from "@/lib/validators/column";

const titleSchema = z.object({
  title: columnTitleSchema,
});

type TitleForm = z.infer<typeof titleSchema>;

interface ColumnHeaderProps {
  column: BoardColumn;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
}

export function ColumnHeader({
  column,
  listeners,
  attributes,
}: ColumnHeaderProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, getValues, setValue } = useForm<TitleForm>({
    resolver: zodResolver(titleSchema),
    defaultValues: { title: column.title },
  });

  const { execute: execUpdate } = useAction(updateColumn, {
    onError: () => {
      setValue("title", column.title);
      toast.error("Erro ao atualizar coluna.");
    },
  });

  const { execute: execDelete } = useAction(deleteColumn, {
    onError: () => toast.error("Erro ao deletar coluna."),
    onSuccess: () => toast.success("Coluna removida."),
  });

  const onBlur = handleSubmit((data) => {
    if (data.title !== column.title) {
      execUpdate({ id: column.id, title: data.title });
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const handleColorSelect = (token: ColumnColorToken) => {
    execUpdate({ id: column.id, color: token });
    setColorOpen(false);
    toast.success("Cor atualizada.");
  };

  const { ref: registerRef, ...registerRest } = register("title");

  return (
    <div className="flex items-center gap-1 px-3 pt-3 pb-2">
      <button
        className="cursor-grab active:cursor-grabbing text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors shrink-0 touch-none"
        {...listeners}
        {...attributes}
        aria-label="Arrastar coluna"
      >
        <GripVertical size={14} />
      </button>

      <input
        {...registerRest}
        ref={(el) => {
          registerRef(el);
          inputRef.current = el;
        }}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-0 text-sm font-semibold text-[color:var(--foreground)] bg-transparent border-none outline-none focus:ring-0 focus:outline-none truncate cursor-text"
        aria-label="Título da coluna"
      />

      <div className="flex items-center gap-0.5 shrink-0">
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              aria-label="Mudar cor"
            >
              <Palette size={13} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="grid grid-cols-4 gap-1.5">
              {COLUMN_COLOR_TOKENS.map((token) => (
                <button
                  key={token}
                  onClick={() => handleColorSelect(token)}
                  className="size-6 rounded-md transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: `var(--column-${token})`,
                    outline:
                      column.color === token
                        ? `2px solid var(--column-${token})`
                        : undefined,
                    outlineOffset: column.color === token ? "2px" : undefined,
                  }}
                  aria-label={`Cor ${token}`}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)]"
              aria-label="Deletar coluna"
            >
              <Trash2 size={13} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar coluna?</AlertDialogTitle>
              <AlertDialogDescription>
                A coluna{" "}
                <span className="font-semibold">
                  &ldquo;{getValues("title")}&rdquo;
                </span>{" "}
                e todos os seus cards serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => execDelete({ id: column.id })}
                className="bg-[color:var(--destructive)] text-[color:var(--destructive-foreground)] hover:opacity-90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
