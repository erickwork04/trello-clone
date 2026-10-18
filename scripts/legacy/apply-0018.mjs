import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const file = path.resolve('db/migrations/0018_shallow_timeslip.sql')
const sql = postgres(process.env.DATABASE_URL || '')

async function main() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL não configurada.')
        }

        const [column] = await sql.unsafe(
            "select exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'board_card_observation' and column_name = 'author_token_hash') as applied"
        )
        if (column?.applied) {
            console.log('Migration 0018 já estava aplicada.')
            return
        }

        const statements = fs.readFileSync(file, 'utf8')
            .split('--> statement-breakpoint')
            .map((statement) => statement.trim())
            .filter(Boolean)

        if (statements.length !== 1) {
            throw new Error('Migration 0018 deve conter exatamente um comando SQL.')
        }

        await sql.begin(async (tx) => {
            await tx.unsafe(statements[0])
        })

        console.log('Migration 0018 aplicada.')
    } catch (error) {
        console.error('Falha ao aplicar a migration 0018:')
        console.error(error.message)
        process.exitCode = 1
    } finally {
        await sql.end()
    }
}

main()
