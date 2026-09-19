# 05 — Inbox

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

`app/(app)/inbox/_actions/organize-inbox-task.ts` (1 export) e
`app/(app)/inbox/_actions/inbox-crud.ts` (5 exports: `createInboxTask`,
`updateInboxTask`, `deleteInboxTask`, `completeInboxTask`,
`moveInboxTask`), ambos manuais, sem Zod. `inbox-crud.ts` já tinha sido
movido de `app/(dashboard)/inbox/actions.ts` (pasta órfã) numa rodada
anterior a esta refatoração, e `completeInboxTask` já tinha sido
corrigido para setar `status: 'DONE'/'BACKLOG'` junto com
`completedAt` (bug de inconsistência com `complete-task.ts`
encontrado na revisão técnica original).

## Depois

- **Criado** `lib/validators/inbox.ts`: `organizeInboxTaskSchema`,
  `createInboxTaskSchema`, `updateInboxTaskSchema`,
  `inboxTaskIdSchema`, `moveInboxTaskSchema`.
- Os 6 exports (1 em `organize-inbox-task.ts` + 5 em `inbox-crud.ts`)
  reescritos como `authActionClient.inputSchema(...).action(...)`.
  Lógica de negócio preservada 1:1, incluindo o fix de
  `completeInboxTask` já existente.

## Call sites atualizados

- `components/dashboard/inbox-task-actions.tsx` — `organizeInboxTask`
  para formato de objeto, com toast de erro.
- `components/dashboard/edit-inbox-task-modal.tsx` — já chamava
  `updateInboxTask` com objeto no formato certo; adicionado toast.
- `components/dashboard/inbox-task-menu.tsx` — `deleteInboxTask` para
  formato de objeto, com toast.
- `components/dashboard/new-inbox-task-button.tsx` — já chamava
  `createInboxTask` com objeto no formato certo; adicionado toast.
- `components/dashboard/complete-inbox-task-button.tsx` —
  `completeInboxTask` para formato de objeto, com toast.
- `components/dashboard/inbox-board.tsx` — `moveInboxTask` para
  formato de objeto. **Melhoria aproveitada:** este componente já
  fazia update otimista (`setItems` antes de chamar a action, sem
  esperar o servidor); adicionei rollback (`setItems(previousItems)`)
  em caso de `serverError`, no mesmo padrão de
  `use-board-dnd.ts` (referência arquitetural do Board). Antes, um
  erro do servidor deixava a UI numa coluna que o banco não refletia,
  sem nenhum aviso.

## Pendências

Nenhuma nova. A duplicação de fluxos de organização do Inbox (kanban
por `inboxStage` vs. botões `organizeInboxTask`) continua registrada
como melhoria de produto na revisão técnica original — não é escopo
desta refatoração de Server Actions.

## Próxima etapa

Feature 06 — Waitlist (auth).
