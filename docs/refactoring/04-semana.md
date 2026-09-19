# 04 — Semana (metas e hábitos)

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

4 arquivos em `app/(app)/semana/_actions/` (`create-week-plan.ts`,
`create-week-task.ts`, `toggle-habit.ts`, `toggle-week-goal.ts`), sem
Zod, sessão manual duplicada. `toggle-habit.ts` fazia um
check-then-act (SELECT seguido de DELETE ou INSERT) fora de
transação — risco de duplicar `week_habit_check` em cliques
concorrentes, apontado na revisão técnica original.

## Depois

- **Criado** `lib/validators/week.ts`: `createWeekPlanSchema`,
  `createWeekTaskSchema`, `toggleHabitSchema`, `toggleWeekGoalSchema`.
- Os 4 arquivos reescritos como `authActionClient.inputSchema(...).action(...)`.
- **Melhoria aproveitada durante a migração:** o check-then-act de
  `toggle-habit.ts` agora está dentro de `db.transaction(...)`,
  reduzindo a janela de corrida entre o SELECT e o
  INSERT/DELETE de `week_habit_check` — mesmo padrão de transação já
  usado em `board/actions.ts` e em `create-week-plan.ts`. Isso não
  elimina 100% o risco (ainda não há unique constraint em
  `(habitId, date)` a nível de banco, que continua registrado como
  pendência na revisão técnica original), mas reduz bastante a chance
  de duplicar o registro.

## Call sites atualizados

- `app/(app)/semana/_components/week-planner-dialog.tsx` — já
  chamava `createWeekPlan` com objeto no formato certo; adicionado
  `toast.error` em `serverError`.
- `app/(app)/semana/_components/quick-week-task.tsx` — idem,
  `createWeekTask` já estava no formato certo; adicionado toast.
- `app/(app)/semana/_components/week-habit-card.tsx` — `toggleHabit`
  já estava no formato certo; adicionado toast para o erro "Hábito
  não encontrado" (antes, sem feedback).
- `app/(app)/semana/_components/week-goal-item.tsx` — única chamada
  que precisou mudar de posicional (`toggleWeekGoal(id, !completed)`)
  para objeto (`toggleWeekGoal({ goalId: id, completed: !completed })`);
  adicionado toast.

## Pendências

Unique constraint em `week_habit_check (habitId, date)` continua
pendente — é uma mudança de schema/migration, fora do escopo desta
refatoração de Server Actions (já registrada na revisão técnica
original, Prioridade 2, item 5).

## Próxima etapa

Feature 05 — Inbox.
