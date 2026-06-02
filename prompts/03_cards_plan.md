# Plano Phase 3 — Cards

## 1. Schema DB (`db/schema/card.ts`)

```ts
card {
  id: text PK uuid
  columnId: text FK → boardColumn (cascade delete)
  name: text not null
  position: integer not null
  createdAt / updatedAt
}
index: card_column_id_idx on columnId
relations: belongsTo column
```

Export em `db/schema/index.ts`. Rodar `drizzle-kit generate` + `migrate`.

## 2. Validators (`lib/validators/card.ts`)

```ts
cardNameSchema = z.string().min(1, 'O nome é obrigatório.').max(120, '...')
```

## 3. Server Actions (`app/(app)/board/actions.ts`)

Adicionar ao arquivo existente, mesmo `authActionClient`:

- `createCard({ columnId, name })` — valida coluna ∈ ctx.boardId via join, insere com `position = max+1`
- `updateCard({ id, name })` — valida ownership via join card→column→board
- `deleteCard({ id })` — mesmo valida ownership
- `moveCard({ cardId, targetColumnId, targetPosition })` — transactional:
    1. valida card + targetColumn ∈ board
    2. recalcula positions na coluna origem (gap) + destino (insere)
    3. update em batch

Todos `revalidatePath("/board")`.

## 4. Page (`app/(app)/board/page.tsx`)

Após fetch columns, fetch cards num query só:

```ts
const cards = await db
    .select()
    .from(card)
    .innerJoin(boardColumn, eq(card.columnId, boardColumn.id))
    .where(eq(boardColumn.boardId, userBoard.id))
    .orderBy(asc(card.position))
```

Agrupar por columnId no server, passar `columns` com `cards` embutidos pra `BoardView`.

## 5. UI Components (`components/board/`)

- **`card-item.tsx`** — `useSortable({ id: card.id, data: { type: "card", columnId } })`. Inline edit nome (form blur salva), botão delete (AlertDialog). Drag handle no card todo.
- **`create-card-button.tsx`** — toggle entre botão e form. `useAction(createCard)`.
- **`column-card.tsx`** (modificar) — renderizar lista de cards dentro de `SortableContext` aninhado com `verticalListSortingStrategy`, items=cardIds. Adicionar `<CreateCardButton columnId={...}/>` no fim.

## 6. Drag-and-drop cross-column

Decisão chave: **um único `DndContext`** no `board-view.tsx` cobrindo colunas + cards. Diferenciação via `data.current.type` ("column" | "card"). Collision: `closestCorners` (melhor pra multi-container).

Handlers:

- `onDragOver` — se card sobre coluna ou outro card de coluna diferente, mover otimisticamente entre listas
- `onDragEnd` — se type=column → `reorderColumns` existente. Se type=card → `moveCard` com posição final

Refatorar `use-reorder.ts` → `use-board-dnd.ts` que gerencia estado local de columns + cards, otimista, rollback em erro.

## 7. Tests (RTL)

Conforme CLAUDE.md, **obrigatório** antes de fechar tarefa. Mock `db`:

- `card-item.test.tsx` — render, edit inline, delete confirm
- `create-card-button.test.tsx` — submit cria, validação min/max
- Actions: testar via mock de `db` retornando dados controlados (criar, mover entre colunas, validação ownership)

## 8. Ordem execução

1. Schema + migration
2. Validator
3. Actions (CRUD sem move)
4. UI básica (criar/editar/deletar) + page fetch
5. Action `moveCard` + lógica DnD cross-column
6. Refactor `use-reorder` → `use-board-dnd`
7. Tests
8. `pnpm lint` + `pnpm build`

## Pontos de atenção

- `position` como integer simples → reorder reescreve várias linhas. OK pra escala atual; alternativa fractional indexing fica fora de escopo.
- Cascade delete já vem do FK — deletar coluna apaga cards.
- Single `DndContext` evita problemas de nested handlers.
