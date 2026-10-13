import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PublicBoardView, type PublicBoardColumn } from './public-board-view'

const columns: PublicBoardColumn[] = [
    {
        id: 'column-1',
        title: 'Em andamento',
        color: 'blue',
        type: 'IN_PROGRESS',
        cards: [
            {
                id: 'card-1',
                name: 'Preparar relatório',
                description: 'Resumo do trabalho',
                dueDate: null,
                createdAt: '2026-10-12T12:00:00.000Z',
                checklistItems: [
                    { id: 'check-1', title: 'Revisar dados', completed: true },
                ],
            },
        ],
    },
]

describe('PublicBoardView', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
    })

    it('opens a card read-only and adds a text-only visitor observation', async () => {
        const user = userEvent.setup()
        fetchMock
            .mockResolvedValueOnce(
                Response.json({
                    observations: [
                        {
                            id: 'observation-1',
                            visitorName: null,
                            content: 'Acompanhamento registrado',
                            createdAt: '2026-10-12T13:00:00.000Z',
                        },
                    ],
                }),
            )
            .mockResolvedValueOnce(
                Response.json({
                    observation: {
                        id: 'observation-2',
                        visitorName: 'Gestor',
                        content: '<script>alert(1)</script>',
                        createdAt: '2026-10-12T14:00:00.000Z',
                    },
                }, { status: 201 })
            )
        render(
            <PublicBoardView
                board={{ id: 'board-1', title: 'Meu Kanban', description: null }}
                columns={columns}
                token={'t'.repeat(43)}
            />
        )

        await user.click(screen.getByRole('button', { name: /Abrir card Preparar relatório/ }))
        expect(await screen.findByRole('heading', { name: 'Preparar relatório' })).toBeTruthy()
        expect(screen.getByText('Revisar dados')).toBeTruthy()

        await user.click(screen.getByRole('tab', { name: /Observações/ }))
        expect(await screen.findByText('Acompanhamento registrado')).toBeTruthy()
        await user.type(screen.getByLabelText(/Seu nome/), 'Gestor')
        await user.type(screen.getByLabelText('Observação'), '<script>alert(1)</script>')
        await user.click(screen.getByRole('button', { name: 'Enviar observação' }))

        expect(await screen.findByText('<script>alert(1)</script>')).toBeTruthy()
        expect(document.querySelector('script')).toBeNull()
        expect(fetchMock).toHaveBeenLastCalledWith(
            expect.stringContaining('/cards/card-1/observations'),
            expect.objectContaining({ method: 'POST' })
        )
        await waitFor(() => expect(screen.getByText('Observação enviada.')).toBeTruthy())
    })
})
