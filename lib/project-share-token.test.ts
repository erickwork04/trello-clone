import { beforeAll, describe, expect, it } from 'vitest'
import {
    createProjectShareToken,
    decryptProjectShareToken,
    encryptProjectShareToken,
    hashProjectShareToken,
} from './project-share-token'

describe('project share token', () => {
    beforeAll(() => {
        process.env.BETTER_AUTH_SECRET = 'test-secret-used-only-by-this-suite'
    })

    it('creates unpredictable URL-safe tokens and stable SHA-256 hashes', () => {
        const first = createProjectShareToken()
        const second = createProjectShareToken()

        expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(second).not.toBe(first)
        expect(hashProjectShareToken(first)).toMatch(/^[a-f0-9]{64}$/)
        expect(hashProjectShareToken(first)).toBe(hashProjectShareToken(first))
    })

    it('encrypts tokens for owner retrieval and rejects tampering', () => {
        const token = createProjectShareToken()
        const encrypted = encryptProjectShareToken(token)

        expect(encrypted).not.toContain(token)
        expect(decryptProjectShareToken(encrypted)).toBe(token)
        const [iv, tag, ciphertext] = encrypted.split('.')
        const alteredTag = `${tag.slice(0, -1)}${tag.endsWith('A') ? 'B' : 'A'}`
        expect(() => decryptProjectShareToken(`${iv}.${alteredTag}.${ciphertext}`)).toThrow()
    })
})
