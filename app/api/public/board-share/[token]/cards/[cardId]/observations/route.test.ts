import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, GET, POST, PUT } from './route'

const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn(), update: vi.fn(), delete: vi.fn() }))

vi.mock('@/db', () => ({ db: mocks }))

function query(result: unknown) {
    const builder = {
        from: () => builder,
        where: () => builder,
        innerJoin: () => builder,
        for: () => builder,
        limit: async () => result,
        orderBy: async () => result,
    }
    return builder
}

function routeParams(token = 'x'.repeat(43), cardId = 'card-1') {
    return { params: Promise.resolve({ token, cardId }) }
}

describe('public board observation endpoint', () => {
    beforeEach(() => vi.clearAllMocks())

    it('rejects malformed and revoked tokens without reading observations', async () => {
        const malformed = await GET(new Request('http://localhost'), routeParams('bad'))
        expect(malformed.status).toBe(404)
        expect(mocks.select).not.toHaveBeenCalled()

        mocks.select.mockReturnValueOnce(query([]))
        const revoked = await GET(new Request('http://localhost'), routeParams())
        expect(revoked.status).toBe(404)
        expect(mocks.select).toHaveBeenCalledTimes(1)
    })

    it('returns JSON when loading observations fails in the database', async () => {
        const failedQuery = {
            from: () => failedQuery,
            where: () => failedQuery,
            orderBy: () => { throw new Error('database query failed') },
        }
        mocks.select
            .mockReturnValueOnce(query([{ boardId: 'shared-board' }]))
            .mockReturnValueOnce(query([{ id: 'card-1' }]))
            .mockReturnValueOnce(failedQuery)

        const response = await GET(new Request('http://localhost'), routeParams())

        expect(response.status).toBe(500)
        await expect(response.json()).resolves.toMatchObject({
            message: 'Não foi possível carregar as observações. Tente novamente.',
        })
    })

    it('blocks posting to a card outside the board identified by the token', async () => {
        const tx = {
            select: vi.fn()
                .mockReturnValueOnce(query([{ boardId: 'shared-board' }]))
                .mockReturnValueOnce(query([])),
            insert: vi.fn(),
        }
        mocks.transaction.mockImplementation(async (callback) => callback(tx))
        const request = new Request('http://localhost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: 'Comentário em outro board' }),
        })

        const response = await POST(request, routeParams())

        expect(response.status).toBe(404)
        expect(tx.insert).not.toHaveBeenCalled()
        await expect(response.json()).resolves.toMatchObject({
            message: 'Este link ou card não está disponível.',
        })
    })

    it('does not let an unauthenticated visitor edit or delete an observation', async () => {
        const token = 'x'.repeat(43)
        const params = routeParams(token)
        const put = await PUT(new Request('http://localhost', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'observation-1', content: 'Alterada' }),
        }), params)
        const remove = await DELETE(new Request('http://localhost', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'observation-1' }),
        }), params)

        expect(put.status).toBe(404)
        expect(remove.status).toBe(404)
        expect(mocks.select).not.toHaveBeenCalled()
        expect(mocks.update).not.toHaveBeenCalled()
        expect(mocks.delete).not.toHaveBeenCalled()
    })

    it('does not let a visitor change an observation owned by another identity', async () => {
        const token = 'x'.repeat(43)
        mocks.select
            .mockReturnValueOnce(query([{ boardId: 'shared-board' }]))
            .mockReturnValueOnce(query([{ id: 'card-1' }]))
            .mockReturnValueOnce(query([]))
        const request = new Request('http://localhost', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Cookie: `board_visitor_${token}=${'a'.repeat(64)}`,
            },
            body: JSON.stringify({ id: 'observation-1', content: 'Alterada' }),
        })

        const response = await PUT(request, routeParams(token))

        expect(response.status).toBe(404)
        expect(mocks.update).not.toHaveBeenCalled()
    })
})
