import 'dotenv/config'
import fs from 'node:fs'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

const migrations = ['0013_brainy_kid_colt.sql', '0014_cloudy_tarot.sql']

async function main() {
    try {
        for (const file of migrations) {
            const path = `./db/migrations/${file}`

            console.log(`\nAplicando migration: ${file}`)

            const migration = fs.readFileSync(path, 'utf8')

            const statements = migration
                .split('--> statement-breakpoint')
                .map((statement) => statement.trim())
                .filter(Boolean)

            for (const statement of statements) {
                await sql.unsafe(statement)
                console.log('Comando executado.')
            }

            console.log(`Migration ${file} aplicada com sucesso.`)
        }
    } catch (error) {
        console.error('\nErro ao aplicar migration:')
        console.error(error)
        process.exitCode = 1
    } finally {
        await sql.end()
    }
}

main()
