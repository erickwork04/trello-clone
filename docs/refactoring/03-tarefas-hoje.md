# 03 — Tarefas (Hoje)

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

5 arquivos em `app/(app)/hoje/_actions/` (`create-task.ts`,
`update-task.ts`, `delete-task.ts`, `complete-task.ts`,
`toggle-top-priority.ts`), cada um com sessão manual e sem Zod.
`delete-task.ts` já tinha o fix de ownership (IDOR) de uma rodada
anterior; `create-task.ts` validava campos condicionais com
`if (!input.area || ...) throw` manual.

## Depois

- **Criado** `lib/validators/task.ts`:
  - `createTaskSchema` — `z.discriminatedUnion('destination', [...])`,
    substituindo a checagem manual de campos condicionais por
    validação declarativa (INBOX não exige área/prioridade/data;
    TODAY exige as três).
  - `updateTaskSchema`, `taskIdSchema`, `completeTaskSchema` (com
    `returnStatus` default `'TODAY'`, preservando o valor padrão que
    a função original tinha), `toggleTopPrioritySchema`.
- Os 5 arquivos reescritos como `authActionClient.inputSchema(...).action(...)`.
  Lógica de negócio idêntica à original, incluindo o limite de 3
  prioridades em `toggle-top-priority.ts`.

## Call sites atualizados

- `components/dashboard/create-task-button.tsx` — chamada agora
  monta o objeto certo por variante (`destination: 'TODAY'` com todos
  os campos, ou `destination: 'INBOX'` só com título/descrição), em
  vez de passar `undefined` nos campos condicionais. Adicionado
  `toast.error` em `serverError`.
- `components/dashboard/task-actions.tsx` — `updateTask`/`deleteTask`
  no formato de objeto, com toast de erro.
- `components/dashboard/task-row.tsx` — `toggleTopPriority` e
  `completeTask` no formato de objeto. **Ganho de UX incidental:**
  antes, o erro "Você já possui 3 prioridades para hoje" era uma
  exceção não tratada dentro do `startTransition` (sem feedback nenhum
  ao usuário); agora aparece como `toast.error`.
- `components/board/work-task-card.tsx` — `completeTask` no formato
  de objeto (`returnStatus: 'BACKLOG'`).
- `components/dashboard/focus-task-checkbox.tsx` — `completeTask` no
  formato de objeto.

## Pendências

Nenhuma. Busca final por `completeTask(`/`toggleTopPriority(`/etc. no
formato antigo (posicional) não retornou nenhuma ocorrência fora dos
arquivos de action.

## Próxima etapa

Feature 04 — Semana (metas/hábitos).
