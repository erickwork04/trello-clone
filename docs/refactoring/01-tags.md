# 01 — Tags

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

`app/(app)/tags/actions.ts` — 3 exports (`createTag`, `updateTag`,
`deleteTag`), cada um repetindo `auth.api.getSession` + `if (!session)
throw` manualmente, sem schema Zod (apenas `if (!trimmedName) throw`).

## Depois

- **Criado** `lib/validators/tag.ts`: `tagNameSchema`, `tagColorSchema`,
  `tagIdSchema`.
- **Reescrito** `app/(app)/tags/actions.ts`: os 3 exports agora são
  `authActionClient.inputSchema(...).action(...)`, no mesmo formato de
  `app/(app)/board/actions.ts`.
- `updateTag` passou a validar explicitamente que a tag existe e
  pertence ao usuário antes de atualizar (antes, um update para um id
  inexistente/de outro usuário simplesmente não afetava nenhuma linha,
  silenciosamente — comportamento não documentado, agora consistente
  com o padrão do Board, que lança erro nesse caso).

## Call sites atualizados

- `components/dashboard/new-tag-button.tsx` — `createTag(...)` agora
  retorna `{ data, serverError }`; adicionado `toast.error(...)` em
  caso de erro (padrão já usado em `use-board-dnd.ts`).
- `components/dashboard/tag-actions.tsx` — `updateTag`/`deleteTag`
  idem, com `toast.error(...)`.

## Pendências

Nenhuma. Feature totalmente migrada, sem chamada antiga remanescente.

## Próxima etapa

Feature 02 — Sessão de foco (Hoje).
