import 'dotenv/config'
import postgres from 'postgres'
import fs from 'node:fs'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL não encontrada')
}

const sql = postgres(connectionString, {
    max: 1,
})

try {
    const migration = fs.readFileSync(
        './db/migrations/0007_overjoyed_micromax.sql',
        'utf8'
    )

    console.log('Aplicando migration 0007...')

    await sql.unsafe(migration)

    console.log('✅ Migration 0007 aplicada com sucesso!')
} catch (error) {
    console.error('❌ Erro ao aplicar migration:')
    console.error(error)
} finally {
    await sql.end()
}
