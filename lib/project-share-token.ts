import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
    scryptSync,
} from 'node:crypto'

const key = () => {
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error('A configuração segura de compartilhamento está indisponível.')
    return scryptSync(secret, 'trello-clone-project-share-v1', 32)
}

export function createProjectShareToken() {
    return randomBytes(32).toString('base64url')
}

export function hashProjectShareToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}

export function encryptProjectShareToken(token: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', key(), iv)
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
    return [iv, cipher.getAuthTag(), encrypted]
        .map((value) => value.toString('base64url'))
        .join('.')
}

export function decryptProjectShareToken(value: string) {
    const [encodedIv, encodedTag, encodedCiphertext] = value.split('.')
    if (!encodedIv || !encodedTag || !encodedCiphertext)
        throw new Error('O link de compartilhamento não está disponível.')
    const decipher = createDecipheriv(
        'aes-256-gcm',
        key(),
        Buffer.from(encodedIv, 'base64url')
    )
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))
    return Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
        decipher.final(),
    ]).toString('utf8')
}
