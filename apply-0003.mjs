import 'dotenv/config'
import fs from 'node:fs'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

const migration = fs.readFileSync(
    './db/migrations/0003_black_cobalt_man.sql',
    'utf8'
)

const statements = migration
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean)

try {
    for (const statement of statements) {
        console.log('Executando...')
        await sql.unsafe(statement)
    }

    console.log('Migration 0003 aplicada com sucesso.')
} catch (error) {
    console.error('Erro ao aplicar migration:')
    console.error(error)
} finally {
    await sql.end()
}
