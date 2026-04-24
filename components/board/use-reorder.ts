"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { toast } from "sonner";
import { BoardColumn } from "@/db/schema/column";
import { reorderColumns } from "@/app/(app)/board/actions";

export function useReorder(initialColumns: BoardColumn[]) {
  const [columns, setColumns] = useState(initialColumns);
  const columnsRef = useRef(columns);
  useEffect(() => {
    columnsRef.current = columns;
  });

  // Sync server state into local state after revalidatePath refreshes props.
  // Skipped during active drags via isDragging ref to avoid resetting mid-gesture.
  const isDragging = useRef(false);
  useEffect(() => {
    if (!isDragging.current) {
      setColumns(initialColumns);
    }
  // Compare by serialized IDs+positions to avoid reference churn
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialColumns.map((c) => `${c.id}:${c.position}:${c.title}:${c.color}`).join(",")]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    isDragging.current = false;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = columnsRef.current;
    const oldIndex = current.findIndex((c) => c.id === active.id);
    const newIndex = current.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = current;
    const reordered = arrayMove(current, oldIndex, newIndex);
    setColumns(reordered);

    const result = await reorderColumns({
      orderedIds: reordered.map((c) => c.id),
    });

    if (result?.serverError) {
      setColumns(previous);
      toast.error("Erro ao reordenar colunas.");
    }
  }, []);

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  return { columns, handleDragEnd, handleDragStart };
}
