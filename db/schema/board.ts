import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const board = pgTable(
  "board",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Meu Board"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("board_user_id_unique").on(t.userId)],
);

export const boardRelations = relations(board, ({ one }) => ({
  user: one(user, {
    fields: [board.userId],
    references: [user.id],
  }),
}));

export type Board = typeof board.$inferSelect;
export type NewBoard = typeof board.$inferInsert;
