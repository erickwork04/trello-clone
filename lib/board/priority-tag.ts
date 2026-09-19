import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/db'
import { tag } from '@/db/schema/tag'

/**
 * Nome usado hoje para localizar a tag de prioridade máxima.
 *
 * ÚNICO lugar do código que faz essa comparação por nome. Enquanto o
 * schema de `tag` não tiver um identificador estável (ex.: `slug` ou
 * um `board.priorityTagId` selecionado explicitamente pelo usuário),
 * esta é a heurística temporária — mas o restante do app nunca compara
 * por nome, apenas usa o `id` resolvido aqui.
 *
 * Evolução futura sem quebrar quem consome esta função: quando existir
 * um identificador estável, troque a implementação abaixo para usá-lo
 * — a assinatura (`userId` → `tagId | null`) pode continuar igual.
 */
const PRIORITY_TAG_NAME = 'prioridade máxima'

/**
 * Resolve o id da tag "Prioridade máxima" do usuário, se existir.
 * Retorna `null` se o usuário ainda não criou essa tag.
 */
export async function getPriorityTagId(
    userId: string
): Promise<string | null> {
    const [match] = await db
        .select({ id: tag.id })
        .from(tag)
        .where(
            and(
                eq(tag.userId, userId),
                sql`lower(${tag.name}) = ${PRIORITY_TAG_NAME}`
            )
        )
        .limit(1)

    return match?.id ?? null
}
