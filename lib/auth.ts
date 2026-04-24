import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { board } from "@/db/schema/board";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .insert(board)
            .values({ userId: user.id, title: "Meu Board" })
            .onConflictDoNothing({ target: board.userId });
        },
      },
    },
  },
});
