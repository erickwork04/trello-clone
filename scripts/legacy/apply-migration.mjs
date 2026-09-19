import 'dotenv/config'
import postgres from 'postgres'
import fs from 'node:fs'

const sql = postgres(process.env.DATABASE_URL)

const migration = fs.readFileSync(
    './db/migrations/0004_handy_white_tiger.sql',
    'utf8'
)

const statements = migration
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

try {
    console.log('Aplicando migration 0004...')

    for (const statement of statements) {
        console.log('Executando:')
        console.log(statement)

        await sql.unsafe(statement)
    }

    console.log('Migration aplicada com sucesso.')
} catch (error) {
    console.error('Erro ao aplicar migration:')
    console.error(error)
} finally {
    await sql.end()
}
