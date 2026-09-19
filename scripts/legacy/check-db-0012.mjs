import 'dotenv/config'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL não encontrada')
}

const sql = postgres(connectionString, {
    max: 1,
})

try {
    const databaseInfo = await sql.unsafe(`
    select
      current_database() as database,
      current_schema() as schema
  `)

    console.log('\n=== CONEXÃO ATUAL ===')
    console.log(databaseInfo)

    const cardColumns = await sql.unsafe(`
    select
      column_name,
      data_type,
      is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'card'
    order by ordinal_position
  `)

    console.log('\n=== COLUNAS DA TABELA card ===')
    console.table(cardColumns)

    const requiredColumns = await sql.unsafe(`
    select
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'card'
          and column_name = 'description'
      ) as description_exists,

      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'card'
          and column_name = 'due_date'
      ) as due_date_exists
  `)

    console.log('\n=== COLUNAS NOVAS ESPERADAS ===')
    console.log(requiredColumns)

    const requiredTables = await sql.unsafe(`
    select
      to_regclass('public.card_tag') as card_tag,
      to_regclass('public.card_checklist_item') as card_checklist_item
  `)

    console.log('\n=== TABELAS NOVAS ESPERADAS ===')
    console.log(requiredTables)

    const migrationsTable = await sql.unsafe(`
    select
      to_regclass('drizzle.__drizzle_migrations') as drizzle_migrations
  `)

    console.log('\n=== TABELA DE MIGRATIONS ===')
    console.log(migrationsTable)

    const migrationHistory = await sql.unsafe(`
    select *
    from drizzle.__drizzle_migrations
    order by created_at desc
    limit 10
  `)

    console.log('\n=== ÚLTIMAS MIGRATIONS REGISTRADAS ===')
    console.table(migrationHistory)
} catch (error) {
    console.error('\n❌ Erro ao consultar o banco:')
    console.error(error)
} finally {
    await sql.end()
}
