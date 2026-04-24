import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { board } from "./board";

export const boardColumn = pgTable(
  "column",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    boardId: text("board_id")
      .notNull()
      .references(() => board.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    color: text("color").notNull().default("slate"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("column_board_id_idx").on(t.boardId)],
);

export const columnRelations = relations(boardColumn, ({ one }) => ({
  board: one(board, {
    fields: [boardColumn.boardId],
    references: [board.id],
  }),
}));

export type BoardColumn = typeof boardColumn.$inferSelect;
export type NewBoardColumn = typeof boardColumn.$inferInsert;
