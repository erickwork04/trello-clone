'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  ArrowRight,
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
  reorderColumns,
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
  allColumns: Array<{ id: string; title: string; type: string }>
  cardsInColumn: number
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
  allColumns,
  cardsInColumn,
}: ColumnHeaderProps) {
  const [menuOpen, setMenuOpen] =
    useState(false)

  const [deleteOpen, setDeleteOpen] =
    useState(false)

  const [targetColumnId, setTargetColumnId] =
    useState('')

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
      onError: (args) =>
        toast.error(
          args.error.serverError ?? 'Erro ao deletar coluna.'
        ),

      onSuccess: () => {
        toast.success(
          'Coluna removida.'
        )
        setDeleteOpen(false)
        setTargetColumnId('')
      },
    })

  const { execute: execReorder } =
    useAction(reorderColumns, {
      onError: () =>
        toast.error('Erro ao reordenar colunas.'),
    })

  const otherColumns = allColumns.filter(
    (c) => c.id !== column.id
  )

  function moveColumn(direction: 'left' | 'right') {
    const ids = allColumns.map((c) => c.id)
    const index = ids.indexOf(column.id)
    const swapIndex = direction === 'left' ? index - 1 : index + 1

    if (swapIndex < 0 || swapIndex >= ids.length) return

    const reordered = [...ids]
    ;[reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ]

    execReorder({ orderedIds: reordered })
    setMenuOpen(false)
  }

  function handleDeleteClick() {
    setMenuOpen(false)
    setTargetColumnId('')
    setDeleteOpen(true)
  }

  function confirmDelete() {
    if (cardsInColumn > 0 && !targetColumnId) return

    execDelete({
      id: column.id,
      targetColumnId: cardsInColumn > 0 ? targetColumnId : undefined,
    })
  }

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

            {/* MOVER (alternativa ao drag, útil no mobile) */}
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-400">
                Mover coluna
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => moveColumn('left')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                >
                  <ArrowLeft className="size-3.5" />
                  Esquerda
                </button>

                <button
                  type="button"
                  onClick={() => moveColumn('right')}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                >
                  Direita
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="my-3 h-px bg-slate-200" />

            {/* EXCLUIR */}
            <button
              type="button"
              onClick={handleDeleteClick}
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
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setTargetColumnId('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deletar coluna?
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div>
                {cardsInColumn > 0 ? (
                  <>
                    <p>
                      Esta coluna possui{' '}
                      <span className="font-semibold">
                        {cardsInColumn}{' '}
                        {cardsInColumn === 1
                          ? 'tarefa'
                          : 'tarefas'}
                      </span>
                      . Selecione para onde
                      movê-las antes de
                      excluir a coluna{' '}
                      <span className="font-semibold">
                        &ldquo;
                        {getValues('title')}
                        &rdquo;
                      </span>
                      .
                    </p>

                    {otherColumns.length === 0 ? (
                      <p className="mt-3 text-red-600">
                        Não há outra coluna
                        para receber essas
                        tarefas. Crie outra
                        coluna antes de
                        excluir esta.
                      </p>
                    ) : (
                      <select
                        value={targetColumnId}
                        onChange={(e) =>
                          setTargetColumnId(
                            e.target.value
                          )
                        }
                        className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">
                          Selecione a coluna
                          de destino
                        </option>
                        {otherColumns.map(
                          (c) => (
                            <option
                              key={c.id}
                              value={c.id}
                            >
                              {c.title}
                            </option>
                          )
                        )}
                      </select>
                    )}
                  </>
                ) : (
                  <p>
                    A coluna{' '}
                    <span className="font-semibold">
                      &ldquo;
                      {getValues('title')}
                      &rdquo;
                    </span>{' '}
                    está vazia e será
                    removida
                    permanentemente.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              disabled={
                cardsInColumn > 0 &&
                (!targetColumnId ||
                  otherColumns.length === 0)
              }
              className="bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}