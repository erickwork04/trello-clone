import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
    scryptSync,
} from 'node:crypto'

function encryptionKey() {
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret)
        throw new Error('A configuração segura de compartilhamento está indisponível.')
    return scryptSync(secret, 'trello-clone-board-share-v1', 32)
}

export function createBoardShareToken() {
    return randomBytes(32).toString('base64url')
}

export function hashBoardShareToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}

export function encryptBoardShareToken(token: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
    return [iv, cipher.getAuthTag(), ciphertext]
        .map((part) => part.toString('base64url'))
        .join('.')
}

export function decryptBoardShareToken(value: string) {
    const [encodedIv, encodedTag, encodedCiphertext] = value.split('.')
    if (!encodedIv || !encodedTag || !encodedCiphertext)
        throw new Error('O link do board não está disponível.')
    const decipher = createDecipheriv(
        'aes-256-gcm',
        encryptionKey(),
        Buffer.from(encodedIv, 'base64url')
    )
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'))
    return Buffer.concat([
        decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
        decipher.final(),
    ]).toString('utf8')
}
