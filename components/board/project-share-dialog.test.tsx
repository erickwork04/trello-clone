import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectShareDialog } from './project-share-dialog'

const mocks = vi.hoisted(() => ({
    activateProjectShare: vi.fn(),
    getProjectShare: vi.fn(),
    revokeProjectShare: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
}))

vi.mock('@/app/(app)/board/work-actions', () => ({
    activateProjectShare: mocks.activateProjectShare,
    getProjectShare: mocks.getProjectShare,
    revokeProjectShare: mocks.revokeProjectShare,
}))

vi.mock('sonner', () => ({
    toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))

describe('ProjectShareDialog', () => {
    let writeClipboardText: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()
        writeClipboardText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeClipboardText },
        })
    })

    afterEach(() => cleanup())

    it('activates sharing and displays the generated public link', async () => {
        const user = userEvent.setup()
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeClipboardText },
        })
        mocks.getProjectShare.mockResolvedValue({
            data: { isActive: false, path: null },
        })
        mocks.activateProjectShare.mockResolvedValue({
            data: { path: '/share/secure-token' },
        })
        render(<ProjectShareDialog projectId="project-1" />)

        await user.click(screen.getByRole('button', { name: 'Compartilhar' }))
        expect(await screen.findByText('Compartilhamento desativado')).toBeTruthy()
        await user.click(screen.getByRole('button', { name: 'Gerar link público' }))

        expect(await screen.findByDisplayValue('http://localhost:3000/share/secure-token')).toBeTruthy()
        expect(mocks.activateProjectShare).toHaveBeenCalledWith({ projectId: 'project-1' })
        expect(mocks.toastSuccess).toHaveBeenCalledWith('Link público ativado.')
    })

    it('reuses an active link, copies it, and revokes access', async () => {
        const user = userEvent.setup()
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeClipboardText },
        })
        mocks.getProjectShare.mockResolvedValue({
            data: { isActive: true, path: '/share/existing-token' },
        })
        mocks.revokeProjectShare.mockResolvedValue({ data: { isActive: false } })
        render(<ProjectShareDialog projectId="project-2" />)

        await user.click(screen.getByRole('button', { name: 'Compartilhar' }))
        expect(await screen.findByDisplayValue('http://localhost:3000/share/existing-token')).toBeTruthy()
        expect(mocks.activateProjectShare).not.toHaveBeenCalled()
        await user.click(screen.getByRole('button', { name: 'Copiar' }))
        expect(writeClipboardText).toHaveBeenCalledWith(
            'http://localhost:3000/share/existing-token'
        )

        await user.click(screen.getByRole('button', { name: 'Revogar acesso' }))
        await waitFor(() => expect(mocks.revokeProjectShare).toHaveBeenCalledWith({ projectId: 'project-2' }))
        expect(await screen.findByText('Compartilhamento desativado')).toBeTruthy()
        expect(mocks.toastSuccess).toHaveBeenCalledWith('Acesso público revogado.')
    })
})
