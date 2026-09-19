import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

const result = await sql.unsafe(`
  select
    current_database() as database,
    current_schema() as schema,
    to_regclass('public.task') as task
`)

console.log(result)

await sql.end()
