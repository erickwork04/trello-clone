import { and, count, desc, eq, gte } from 'drizzle-orm'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { db } from '@/db'
import { boardCardObservation } from '@/db/schema/board-card-observation'
import { boardShare } from '@/db/schema/board-share'
import { card } from '@/db/schema/card'
import { boardColumn } from '@/db/schema/column'
import { hashBoardShareToken } from '@/lib/board-share-token'
import {
    publicBoardTokenSchema,
    publicObservationInputSchema,
    publicObservationUpdateSchema,
    observationIdSchema,
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

function visitorCookieName(token: string) {
    return `board_visitor_${token}`
}

function visitorIdentity(request: Request, token: string) {
    const name = visitorCookieName(token)
    const cookie = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))
    const value = cookie?.slice(name.length + 1)
    return value && /^[a-f0-9]{64}$/.test(value) ? value : null
}

function hashVisitorIdentity(identity: string) {
    return createHash('sha256').update(identity).digest('hex')
}

function visitorCookieHeader(request: Request, token: string, identity: string) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
    return `${visitorCookieName(token)}=${identity}; Path=/api/public/board-share/${token}/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`
}

function sameHash(left: string, right: string) {
    const a = Buffer.from(left, 'hex')
    const b = Buffer.from(right, 'hex')
    return a.length === b.length && timingSafeEqual(a, b)
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

export async function GET(request: Request, { params }: RouteParams) {
    const { token, cardId } = await params
    const share = await activeShare(token)
    if (!share || !(await cardBelongsToBoard(share.boardId, cardId)))
        return json({ message: 'Este link ou card não está disponível.' }, 404)

    try {
        const rows = await db
            .select({
                id: boardCardObservation.id,
                visitorName: boardCardObservation.visitorName,
                content: boardCardObservation.content,
                createdAt: boardCardObservation.createdAt,
                authorTokenHash: boardCardObservation.authorTokenHash,
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

        const identity = visitorIdentity(request, token)
        return json({
            observations: rows.map((row) => ({
                ...row,
                canEdit: Boolean(identity && row.authorTokenHash && sameHash(row.authorTokenHash, hashVisitorIdentity(identity))),
                authorTokenHash: undefined,
                createdAt: row.createdAt.toISOString(),
            })),
        })
    } catch {
        return json({ message: 'Não foi possível carregar as observações. Tente novamente.' }, 500)
    }
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

    const existingIdentity = visitorIdentity(request, token)
    const identity = existingIdentity ?? randomBytes(32).toString('hex')
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
                    authorTokenHash: hashVisitorIdentity(identity),
                })
                .returning({
                    id: boardCardObservation.id,
                    visitorName: boardCardObservation.visitorName,
                    content: boardCardObservation.content,
                    createdAt: boardCardObservation.createdAt,
                })

            return row
        })

        const response = json({
            observation: { ...inserted, canEdit: true, createdAt: inserted.createdAt.toISOString() },
        }, 201)
        if (!existingIdentity) response.headers.set('Set-Cookie', visitorCookieHeader(request, token, identity))
        return response
    } catch (error) {
        if (error instanceof ObservationRequestError)
            return json({ message: error.message }, error.status)
        return json({ message: 'Não foi possível salvar a observação. Tente novamente.' }, 500)
    }
}

async function readMutationBody(request: Request) {
    const contentType = request.headers.get('content-type')?.split(';')[0].trim()
    if (contentType !== 'application/json')
        throw new ObservationRequestError('Envie os dados no formato JSON.', 415)
    if (Number(request.headers.get('content-length') ?? 0) > 8192)
        throw new ObservationRequestError('O conteúdo enviado é muito grande.', 413)
    try {
        return await readLimitedJson(request)
    } catch (error) {
        if (error instanceof ObservationRequestError) throw error
        throw new ObservationRequestError('O conteúdo enviado não é um JSON válido.', 400)
    }
}

async function ownedVisitorObservation(token: string, cardId: string, observationId: string, identity: string) {
    const share = await activeShare(token)
    if (!share || !(await cardBelongsToBoard(share.boardId, cardId))) return null
    const [row] = await db.select({ id: boardCardObservation.id })
        .from(boardCardObservation)
        .where(and(
            eq(boardCardObservation.id, observationId),
            eq(boardCardObservation.boardId, share.boardId),
            eq(boardCardObservation.cardId, cardId),
            eq(boardCardObservation.authorTokenHash, hashVisitorIdentity(identity))
        ))
        .limit(1)
    return row ? { share, row } : null
}

export async function PUT(request: Request, { params }: RouteParams) {
    const { token, cardId } = await params
    const identity = visitorIdentity(request, token)
    if (!publicBoardTokenSchema.safeParse(token).success || !identity)
        return json({ message: 'Esta observação não pode ser alterada neste navegador.' }, 404)
    try {
        const body = await readMutationBody(request)
        const parsed = publicObservationUpdateSchema.extend({ id: observationIdSchema.shape.id }).safeParse(body)
        if (!parsed.success) return json({ message: parsed.error.issues[0]?.message ?? 'Revise os dados da observação.' }, 400)
        const owned = await ownedVisitorObservation(token, cardId, parsed.data.id, identity)
        if (!owned) return json({ message: 'Observação não encontrada ou sem permissão.' }, 404)
        const [updated] = await db.update(boardCardObservation)
            .set({ content: parsed.data.content })
            .where(eq(boardCardObservation.id, parsed.data.id))
            .returning({ id: boardCardObservation.id, content: boardCardObservation.content })
        return json({ observation: { ...updated, canEdit: true } })
    } catch (error) {
        if (error instanceof ObservationRequestError) return json({ message: error.message }, error.status)
        return json({ message: 'Não foi possível salvar a observação. Tente novamente.' }, 500)
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    const { token, cardId } = await params
    const identity = visitorIdentity(request, token)
    if (!publicBoardTokenSchema.safeParse(token).success || !identity)
        return json({ message: 'Esta observação não pode ser alterada neste navegador.' }, 404)
    try {
        const body = await readMutationBody(request)
        const parsed = observationIdSchema.safeParse(body)
        if (!parsed.success) return json({ message: 'Identificador da observação inválido.' }, 400)
        const owned = await ownedVisitorObservation(token, cardId, parsed.data.id, identity)
        if (!owned) return json({ message: 'Observação não encontrada ou sem permissão.' }, 404)
        await db.delete(boardCardObservation).where(eq(boardCardObservation.id, parsed.data.id))
        return json({ id: parsed.data.id })
    } catch (error) {
        if (error instanceof ObservationRequestError) return json({ message: error.message }, error.status)
        return json({ message: 'Não foi possível excluir a observação. Tente novamente.' }, 500)
    }
}
