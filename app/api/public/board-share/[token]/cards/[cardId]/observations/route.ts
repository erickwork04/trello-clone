import { and, count, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { boardCardObservation } from '@/db/schema/board-card-observation'
import { boardShare } from '@/db/schema/board-share'
import { card } from '@/db/schema/card'
import { boardColumn } from '@/db/schema/column'
import { hashBoardShareToken } from '@/lib/board-share-token'
import {
    publicBoardTokenSchema,
    publicObservationInputSchema,
} from '@/lib/validators/board-share'

type RouteParams = {
    params: Promise<{ token: string; cardId: string }>
}

class ObservationRequestError extends Error {
    constructor(
        message: string,
        readonly status: number
    ) {
        super(message)
    }
}

function json(body: unknown, status = 200) {
    return Response.json(body, {
        status,
        headers: {
            'Cache-Control': 'private, no-store, max-age=0',
            'Referrer-Policy': 'no-referrer',
            'X-Content-Type-Options': 'nosniff',
        },
    })
}

async function readLimitedJson(request: Request): Promise<unknown> {
    const reader = request.body?.getReader()
    if (!reader) throw new SyntaxError('Corpo vazio.')

    const chunks: Uint8Array[] = []
    let totalBytes = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            totalBytes += value.byteLength
            if (totalBytes > 8192) {
                await reader.cancel()
                throw new ObservationRequestError(
                    'O conteúdo enviado é muito grande.',
                    413
                )
            }
            chunks.push(value)
        }
    } finally {
        reader.releaseLock()
    }

    const bytes = new Uint8Array(totalBytes)
    let offset = 0
    for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

async function activeShare(token: string) {
    if (!publicBoardTokenSchema.safeParse(token).success) return null
    const [share] = await db
        .select({ boardId: boardShare.boardId })
        .from(boardShare)
        .where(
            and(
                eq(boardShare.tokenHash, hashBoardShareToken(token)),
                eq(boardShare.isActive, true)
            )
        )
        .limit(1)
    return share ?? null
}

async function cardBelongsToBoard(boardId: string, cardId: string) {
    const [ownedCard] = await db
        .select({ id: card.id })
        .from(card)
        .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
        .where(and(eq(card.id, cardId), eq(boardColumn.boardId, boardId)))
        .limit(1)
    return Boolean(ownedCard)
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { token, cardId } = await params
    const share = await activeShare(token)
    if (!share || !(await cardBelongsToBoard(share.boardId, cardId)))
        return json({ message: 'Este link ou card não está disponível.' }, 404)

    const rows = await db
        .select({
            id: boardCardObservation.id,
            visitorName: boardCardObservation.visitorName,
            content: boardCardObservation.content,
            createdAt: boardCardObservation.createdAt,
        })
        .from(boardCardObservation)
        .where(
            and(
                eq(boardCardObservation.boardId, share.boardId),
                eq(boardCardObservation.cardId, cardId)
            )
        )
        .orderBy(desc(boardCardObservation.createdAt))
        .limit(100)

    return json({
        observations: rows.map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
        })),
    })
}

export async function POST(request: Request, { params }: RouteParams) {
    const { token, cardId } = await params
    if (!publicBoardTokenSchema.safeParse(token).success)
        return json({ message: 'Este link ou card não está disponível.' }, 404)

    const contentType = request.headers.get('content-type')?.split(';')[0].trim()
    if (contentType !== 'application/json')
        return json({ message: 'Envie os dados no formato JSON.' }, 415)

    const declaredSize = Number(request.headers.get('content-length') ?? 0)
    if (declaredSize > 8192)
        return json({ message: 'O conteúdo enviado é muito grande.' }, 413)

    let body: unknown
    try {
        body = await readLimitedJson(request)
    } catch (error) {
        if (error instanceof ObservationRequestError)
            return json({ message: error.message }, error.status)
        return json({ message: 'O conteúdo enviado não é um JSON válido.' }, 400)
    }

    const parsed = publicObservationInputSchema.safeParse(body)
    if (!parsed.success)
        return json({ message: parsed.error.issues[0]?.message ?? 'Revise os dados da observação.' }, 400)

    try {
        const inserted = await db.transaction(async (tx) => {
            const [share] = await tx
                .select({ boardId: boardShare.boardId })
                .from(boardShare)
                .where(
                    and(
                        eq(boardShare.tokenHash, hashBoardShareToken(token)),
                        eq(boardShare.isActive, true)
                    )
                )
                .for('update')
                .limit(1)

            if (!share)
                throw new ObservationRequestError(
                    'Este link ou card não está disponível.',
                    404
                )

            const [ownedCard] = await tx
                .select({ id: card.id })
                .from(card)
                .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
                .where(
                    and(
                        eq(card.id, cardId),
                        eq(boardColumn.boardId, share.boardId)
                    )
                )
                .limit(1)
            if (!ownedCard)
                throw new ObservationRequestError(
                    'Este link ou card não está disponível.',
                    404
                )

            const windowStart = new Date(Date.now() - 60_000)
            const [recent] = await tx
                .select({ total: count() })
                .from(boardCardObservation)
                .where(
                    and(
                        eq(boardCardObservation.boardId, share.boardId),
                        gte(boardCardObservation.createdAt, windowStart)
                    )
                )
            if ((recent?.total ?? 0) >= 10)
                throw new ObservationRequestError(
                    'Muitas observações foram enviadas. Aguarde um minuto e tente novamente.',
                    429
                )

            const [row] = await tx
                .insert(boardCardObservation)
                .values({
                    boardId: share.boardId,
                    cardId,
                    visitorName: parsed.data.visitorName?.trim() || null,
                    content: parsed.data.content,
                })
                .returning({
                    id: boardCardObservation.id,
                    visitorName: boardCardObservation.visitorName,
                    content: boardCardObservation.content,
                    createdAt: boardCardObservation.createdAt,
                })

            return row
        })

        return json({
            observation: { ...inserted, createdAt: inserted.createdAt.toISOString() },
        }, 201)
    } catch (error) {
        if (error instanceof ObservationRequestError)
            return json({ message: error.message }, error.status)
        return json({ message: 'Não foi possível salvar a observação. Tente novamente.' }, 500)
    }
}
