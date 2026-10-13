import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({ select: vi.fn(), transaction: vi.fn() }))

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
})
