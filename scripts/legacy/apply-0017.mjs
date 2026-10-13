import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const migrationsDir = path.resolve('db/migrations')

const migrations = ['0017_handy_dark_beast.sql']

const sql = postgres(process.env.DATABASE_URL || '')

async function main() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL não configurada.')
        }

        const files = fs.readdirSync(migrationsDir).sort()

        const migrationFiles = migrations.map((pattern, index) => {
            const prefix = pattern.slice(0, 4)
            const matches = files.filter(
                (file) => file.startsWith(prefix) && file.endsWith('.sql')
            )

            if (matches.length !== 1) {
                throw new Error(
                    `Esperado exatamente um arquivo para ${prefix}; encontrados: ${matches.join(', ') || 'nenhum'}`
                )
            }

            return matches[0]
        })

        const statementsByFile = migrationFiles.map((file) => {
            const content = fs.readFileSync(
                path.join(migrationsDir, file),
                'utf8'
            )

            const statements = content
                .split('--> statement-breakpoint')
                .map((statement) => statement.trim())
                .filter(Boolean)

            if (statements.length === 0) {
                throw new Error(`Migration vazia: ${file}`)
            }

            return { file, statements }
        })

        console.log('Migrations encontradas:')
        for (const migration of statementsByFile) {
            console.log(`- ${migration.file}`)
        }

        console.log(
            '\nAtenção: confirme que DATABASE_URL aponta para o banco correto.'
        )

        await sql.begin(async (tx) => {
            for (const migration of statementsByFile) {
                console.log(`\nAplicando ${migration.file}...`)

                for (const statement of migration.statements) {
                    await tx.unsafe(statement)
                }

                console.log(`${migration.file}: executada.`)
            }
        })

        console.log('\nAs migrations foram aplicadas na mesma transação.')
    } catch (error) {
        console.error('\nFalha ao aplicar migrations:')
        console.error(error.message)
        console.error(
            'Se a transação foi iniciada, as alterações foram revertidas.'
        )
        process.exitCode = 1
    } finally {
        await sql.end()
    }
}

main()
