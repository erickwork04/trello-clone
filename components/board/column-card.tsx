"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BoardColumn } from "@/db/schema/column";
import { columnColorToCss } from "@/lib/validators/column";
import { ColumnHeader } from "./column-header";

interface ColumnCardProps {
  column: BoardColumn;
}

export function ColumnCard({ column }: ColumnCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-none w-[272px] flex flex-col rounded-[var(--radius)] bg-[color:var(--card)] border border-[color:var(--border)] shadow-sm select-none"
    >
      <div
        className="w-full h-1 rounded-t-[var(--radius)] shrink-0"
        style={{ backgroundColor: columnColorToCss(column.color) }}
        aria-hidden
      />
      <ColumnHeader
        column={column}
        listeners={listeners}
        attributes={attributes}
      />
      <div className="flex-1 px-3 pb-3 min-h-[120px]">
        <div className="h-full rounded-md border border-dashed border-[color:var(--border)] flex items-center justify-center">
          <span className="text-xs text-[color:var(--muted-foreground)]">
            Sem cards
          </span>
        </div>
      </div>
    </div>
  );
}
