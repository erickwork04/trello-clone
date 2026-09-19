import { z } from 'zod'

export const tagNameSchema = z
    .string()
    .min(1, 'Informe o nome da tag.')
    .max(60, 'O nome deve ter no máximo 60 caracteres.')

export const tagColorSchema = z
    .string()
    .min(1, 'Selecione uma cor.')

export const tagIdSchema = z.string().min(1, 'Tag inválida.')
