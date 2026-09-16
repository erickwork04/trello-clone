'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  GripVertical,
  MoreHorizontal,
  Palette,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAction } from 'next-safe-action/hooks'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'

import {
  updateColumn,
  deleteColumn,
} from '@/app/(app)/board/actions'

import { BoardColumn } from '@/db/schema/column'

import { DraggableAttributes } from '@dnd-kit/core'
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

import {
  COLUMN_COLOR_TOKENS,
  ColumnColorToken,
  columnTitleSchema,
  columnColorToCss,
} from '@/lib/validators/column'

const titleSchema = z.object({
  title: columnTitleSchema,
})

type TitleForm = z.infer<typeof titleSchema>

interface ColumnHeaderProps {
  column: BoardColumn
  listeners: SyntheticListenerMap | undefined
  attributes: DraggableAttributes
}

const columnTypes = [
  {
    value: 'DEFAULT',
    label: 'Neutra',
  },
  {
    value: 'PENDING',
    label: 'Pendente',
  },
  {
    value: 'IN_PROGRESS',
    label: 'Em andamento',
  },
  {
    value: 'DONE',
    label: 'Concluída',
  },
] as const

export function ColumnHeader({
  column,
  listeners,
  attributes,
}: ColumnHeaderProps) {
  const [menuOpen, setMenuOpen] =
    useState(false)

  const [deleteOpen, setDeleteOpen] =
    useState(false)

  const inputRef =
    useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
  } = useForm<TitleForm>({
    resolver: zodResolver(titleSchema),
    defaultValues: {
      title: column.title,
    },
  })

  const { execute: execUpdate } =
    useAction(updateColumn, {
      onError: () => {
        setValue(
          'title',
          column.title
        )

        toast.error(
          'Erro ao atualizar coluna.'
        )
      },
    })

  const { execute: execDelete } =
    useAction(deleteColumn, {
      onError: () =>
        toast.error(
          'Erro ao deletar coluna.'
        ),

      onSuccess: () =>
        toast.success(
          'Coluna removida.'
        ),
    })

  const onBlur = handleSubmit(
    (data) => {
      if (
        data.title !==
        column.title
      ) {
        execUpdate({
          id: column.id,
          title: data.title,
        })
      }
    }
  )

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === 'Enter' ||
      event.key === 'Escape'
    ) {
      event.preventDefault()
      inputRef.current?.blur()
    }
  }

  function handleColorSelect(
    token: ColumnColorToken
  ) {
    execUpdate({
      id: column.id,
      color: token,
    })

    toast.success(
      'Cor atualizada.'
    )
  }

  function handleTypeSelect(
    type:
      | 'DEFAULT'
      | 'PENDING'
      | 'IN_PROGRESS'
      | 'DONE'
  ) {
    execUpdate({
      id: column.id,
      type,
    })

    setMenuOpen(false)

    toast.success(
      'Tipo da coluna atualizado.'
    )
  }

  const {
    ref: registerRef,
    ...registerRest
  } = register('title')

  return (
    <>
      <div className="flex items-center gap-2 py-1">

        {/* ARRASTAR */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-slate-700 active:cursor-grabbing"
          {...listeners}
          {...attributes}
          aria-label="Arrastar coluna"
        >
          <GripVertical className="size-4" />
        </button>

        {/* COR */}
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor:
              columnColorToCss(
                column.color
              ),
          }}
        />

        {/* TÍTULO */}
        <input
          {...registerRest}
          ref={(element) => {
            registerRef(element)
            inputRef.current =
              element
          }}
          onBlur={onBlur}
          onKeyDown={
            handleKeyDown
          }
          className="min-w-0 flex-1 truncate border-none bg-transparent text-sm font-semibold text-slate-800 outline-none"
          aria-label="Título da coluna"
        />

        {/* MENU */}
        <Popover
          open={menuOpen}
          onOpenChange={
            setMenuOpen
          }
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 rounded-md text-slate-400 hover:bg-white hover:text-slate-700"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-55 p-3"
          >
            {/* TIPO */}
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-400">
                Tipo da coluna
              </p>

              <div className="space-y-1">
                {columnTypes.map(
                  (item) => (
                    <button
                      key={
                        item.value
                      }
                      type="button"
                      onClick={() =>
                        handleTypeSelect(
                          item.value
                        )
                      }
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm transition hover:bg-slate-100 ${column.type ===
                        item.value
                        ? 'font-semibold text-blue-600'
                        : 'text-slate-700'
                        }`}
                    >
                      <span
                        className={`size-2 rounded-full ${column.type ===
                          item.value
                          ? 'bg-blue-600'
                          : 'bg-slate-300'
                          }`}
                      />

                      {
                        item.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="my-3 h-px bg-slate-200" />

            {/* CORES */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Palette className="size-4 text-slate-400" />

                <p className="text-xs font-semibold text-slate-400">
                  Cor da coluna
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {COLUMN_COLOR_TOKENS.map(
                  (token) => (
                    <button
                      key={
                        token
                      }
                      type="button"
                      onClick={() =>
                        handleColorSelect(
                          token
                        )
                      }
                      className="size-7 rounded-md transition-transform hover:scale-110"
                      style={{
                        backgroundColor:
                          `var(--column-${token})`,

                        outline:
                          column.color ===
                            token
                            ? `2px solid var(--column-${token})`
                            : undefined,

                        outlineOffset:
                          column.color ===
                            token
                            ? '2px'
                            : undefined,
                      }}
                    />
                  )
                )}
              </div>
            </div>

            <div className="my-3 h-px bg-slate-200" />

            {/* EXCLUIR */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(
                  false
                )

                setDeleteOpen(
                  true
                )
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="size-4" />

              Excluir coluna
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* DELETE */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deletar coluna?
            </AlertDialogTitle>

            <AlertDialogDescription>
              A coluna{' '}
              <span className="font-semibold">
                &ldquo;
                {getValues(
                  'title'
                )}
                &rdquo;
              </span>{' '}
              e todos os seus
              cards serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() =>
                execDelete({
                  id: column.id,
                })
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}