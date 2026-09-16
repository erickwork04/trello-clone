import { z } from 'zod'

export const COLUMN_COLOR_TOKENS = [
    'slate',
    'blue',
    'green',
    'amber',
    'red',
    'purple',
    'pink',
    'cyan',
] as const

export type ColumnColorToken = (typeof COLUMN_COLOR_TOKENS)[number]

export function columnColorToCss(color: string): string {
    if (color.startsWith('#')) return color
    return `var(--column-${color})`
}

export const columnColorSchema = z.enum(COLUMN_COLOR_TOKENS, {
    error: 'Cor inválida.',
})

export const columnTypeSchema = z.enum([
    'DEFAULT',
    'PENDING',
    'IN_PROGRESS',
    'DONE',
])

export type ColumnType = z.infer<typeof columnTypeSchema>

export const columnTitleSchema = z
    .string()
    .min(1, 'O título é obrigatório.')
    .max(80, 'O título deve ter no máximo 80 caracteres.')
