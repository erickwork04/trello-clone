# 00 — Fundação: `lib/safe-action.ts`

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

Um único `authActionClient` fazia sessão **e** lookup de board juntos,
mesmo sendo usado hoje apenas por `app/(app)/board/actions.ts`. Migrar
as demais features (tasks, tags, semana, inbox, foco) para
`next-safe-action` exigiria ou reusar esse client (forçando um lookup
de board desnecessário em domínios que não têm relação com board), ou
duplicar um client novo por feature.

## Depois

`lib/safe-action.ts` agora expõe dois clients:

- `authActionClient` — apenas sessão. É o client padrão para a
  maioria das actions do app.
- `authBoardActionClient` — estende `authActionClient` e adiciona
  `ctx.boardId` (lookup do board do usuário). Usado só pelo domínio
  Board.

`app/(app)/board/actions.ts` foi atualizado para importar/usar
`authBoardActionClient` em vez de `authActionClient` (rename simples,
nenhuma lógica de negócio mudou).

## Call sites atualizados

Nenhum client component chama `lib/safe-action.ts` diretamente — é
infraestrutura interna de actions. Nenhum call site de UI foi afetado
por esta etapa.

## Pendências

Nenhuma.

## Próxima etapa

Feature 01 — Tags.
