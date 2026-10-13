import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PublicProjectPage from './page'

const mocks = vi.hoisted(() => ({
    connection: vi.fn(),
    notFound: vi.fn(),
    select: vi.fn(),
}))

vi.mock('next/server', () => ({ connection: mocks.connection }))
vi.mock('next/navigation', () => ({
    notFound: () => mocks.notFound(),
}))
vi.mock('@/db', () => ({ db: { select: mocks.select } }))

function queryResult<T>(result: T) {
    const query = {
        from: () => query,
        where: () => query,
        innerJoin: () => query,
        limit: async () => result,
        orderBy: async () => result,
    }
    return query
}

describe('public shared project route', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.connection.mockResolvedValue(undefined)
        mocks.notFound.mockImplementation(() => {
            throw new Error('NEXT_NOT_FOUND')
        })
    })

    it('rejects a malformed token before querying project data', async () => {
        await expect(
            PublicProjectPage({ params: Promise.resolve({ token: 'invalid' }) })
        ).rejects.toThrow('NEXT_NOT_FOUND')
        expect(mocks.select).not.toHaveBeenCalled()
    })

    it('returns the not-found page when the token is revoked or unknown', async () => {
        mocks.select.mockReturnValue(queryResult([]))
        const token = 'a'.repeat(43)

        await expect(
            PublicProjectPage({ params: Promise.resolve({ token }) })
        ).rejects.toThrow('NEXT_NOT_FOUND')
        expect(mocks.select).toHaveBeenCalledTimes(1)
    })

    it('renders the shared project without a login session', async () => {
        const results = [
            [{ projectId: 'project-1' }],
            [{ name: 'Projeto de teste', description: 'Acompanhamento público', status: 'IN_PROGRESS', dueDate: null }],
            [],
            [],
            [],
            [],
        ]
        mocks.select.mockImplementation(() => queryResult(results.shift() ?? []))

        const page = await PublicProjectPage({
            params: Promise.resolve({ token: 'b'.repeat(43) }),
        })
        render(page)

        expect(screen.getByRole('heading', { name: 'Projeto de teste' })).toBeTruthy()
        expect(screen.getByText('Acompanhamento público')).toBeTruthy()
        expect(mocks.select).toHaveBeenCalledTimes(6)
    })
})
