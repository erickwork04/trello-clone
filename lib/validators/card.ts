import { z } from 'zod'

export const cardNameSchema = z
    .string()
    .min(1, 'O nome é obrigatório.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.')
