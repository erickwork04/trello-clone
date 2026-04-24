"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { boardColumn } from "@/db/schema/column";
import { authActionClient } from "@/lib/safe-action";
import { eq, max, and } from "drizzle-orm";
import { columnColorSchema, columnTitleSchema } from "@/lib/validators/column";

const createColumnSchema = z.object({
  title: columnTitleSchema,
  color: columnColorSchema.optional(),
});

const updateColumnSchema = z.object({
  id: z.string().min(1),
  title: columnTitleSchema.optional(),
  color: columnColorSchema.optional(),
});

const deleteColumnSchema = z.object({
  id: z.string().min(1),
});

const reorderColumnsSchema = z.object({
  orderedIds: z.array(z.string()).min(1, "Lista de colunas inválida."),
});

export const createColumn = authActionClient
  .inputSchema(createColumnSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [result] = await db
      .select({ maxPos: max(boardColumn.position) })
      .from(boardColumn)
      .where(eq(boardColumn.boardId, ctx.boardId));

    const nextPosition = (result?.maxPos ?? -1) + 1;

    await db.insert(boardColumn).values({
      boardId: ctx.boardId,
      title: parsedInput.title,
      position: nextPosition,
      color: parsedInput.color ?? "slate",
    });

    revalidatePath("/board");
  });

export const updateColumn = authActionClient
  .inputSchema(updateColumnSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [col] = await db
      .select()
      .from(boardColumn)
      .where(
        and(
          eq(boardColumn.id, parsedInput.id),
          eq(boardColumn.boardId, ctx.boardId),
        ),
      )
      .limit(1);

    if (!col) throw new Error("Coluna não encontrada.");

    await db
      .update(boardColumn)
      .set({
        ...(parsedInput.title !== undefined && { title: parsedInput.title }),
        ...(parsedInput.color !== undefined && { color: parsedInput.color }),
      })
      .where(eq(boardColumn.id, parsedInput.id));

    revalidatePath("/board");
  });

export const deleteColumn = authActionClient
  .inputSchema(deleteColumnSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [col] = await db
      .select()
      .from(boardColumn)
      .where(
        and(
          eq(boardColumn.id, parsedInput.id),
          eq(boardColumn.boardId, ctx.boardId),
        ),
      )
      .limit(1);

    if (!col) throw new Error("Coluna não encontrada.");

    await db.delete(boardColumn).where(eq(boardColumn.id, parsedInput.id));

    revalidatePath("/board");
  });

export const reorderColumns = authActionClient
  .inputSchema(reorderColumnsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db.transaction(async (tx) => {
      const currentColumns = await tx
        .select({ id: boardColumn.id })
        .from(boardColumn)
        .where(eq(boardColumn.boardId, ctx.boardId));

      const currentIds = new Set(currentColumns.map((c) => c.id));
      const inputIds = new Set(parsedInput.orderedIds);

      const sameSize = currentIds.size === inputIds.size;
      const sameIds = [...inputIds].every((id) => currentIds.has(id));

      if (!sameSize || !sameIds) {
        throw new Error("Lista de colunas desatualizada.");
      }

      for (let i = 0; i < parsedInput.orderedIds.length; i++) {
        await tx
          .update(boardColumn)
          .set({ position: i })
          .where(
            and(
              eq(boardColumn.id, parsedInput.orderedIds[i]),
              eq(boardColumn.boardId, ctx.boardId),
            ),
          );
      }
    });

    revalidatePath("/board");
  });
