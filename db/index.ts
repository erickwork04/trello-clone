import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ??
  postgres(process.env.DATABASE_URL!, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60,
  });

globalForDb.postgresClient = client;

export const db = drizzle(client);
