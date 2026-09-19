# Refatoração arquitetural — Server Actions

## Objetivo

Unificar todas as Server Actions do projeto no padrão já usado em
`app/(app)/board/actions.ts`: `next-safe-action` + schemas Zod em
`lib/validators/`, eliminando o padrão manual (`'use server'` +
`auth.api.getSession` duplicado + checagens ad-hoc) usado nas demais
features.

Board é a referência arquitetural. Nenhuma regra de negócio muda —
esta é uma refatoração estrutural, não uma reescrita de produto.

**Branch/commit base:** `main` @ `4256ae0747da42d33593a227091c8d52219279df`
("feat: add waitlist and improve auth experience").

## Como ler este diretório

Cada arquivo `NN-nome-da-feature.md` documenta uma feature migrada:
o que existia antes, o que foi criado/alterado, os call sites (client
components) atualizados, e o que ficou pendente (se algo ficou).//
Este README é o índice e o status consolidado — atualizado a cada
feature concluída.

## Status geral

| # | Feature | Status |
|---|---|---|
| 00 | Fundação (`lib/safe-action.ts`) | ✅ concluído |
| 01 | Tags | ✅ concluído |
| 02 | Sessão de foco (Hoje) | ✅ concluído |
| 03 | Tarefas (Hoje) | ✅ concluído |
| 04 | Semana (metas/hábitos) | ✅ concluído |
| 05 | Inbox | ✅ concluído |
| 06 | Waitlist (auth) | ✅ concluído |

Legenda: ⏳ pendente/em andamento · ✅ concluído e validado (typecheck
+ lint) · ⚠️ concluído com pendência anotada.

Todas as 7 etapas estão concluídas. Ver "Validação final" mais abaixo.

## Escopo desta refatoração

**Dentro do escopo:**
- Migrar toda action `'use server'` para `next-safe-action`.
- Criar schemas Zod em `lib/validators/` para cada domínio que não tinha.
- Atualizar todos os call sites (componentes client) para o novo formato
  de retorno (`{ data, serverError, validationErrors }`).
- Corrigir, no caminho, qualquer checagem de ownership ausente que a
  migração revele (nenhuma encontrada além das já corrigidas antes desta
  etapa — ver `delete-task.ts` e `start-focus.ts`, tratados na rodada de
  correções de segurança anterior a esta refatoração).

**Fora do escopo (não alterado nesta etapa):**
- Substituição de cores Tailwind hardcoded por variáveis de tema.
- Adoção de `dayjs` para datas.
- Unificação dos dois fluxos de organização do Inbox (kanban vs botões).
- 4 erros de lint `react-hooks/set-state-in-effect` **pré-existentes**
  (confirmados via `git diff` — nenhum deles em arquivo tocado por esta
  refatoração): `components/board/board-view.tsx:52`,
  `components/dashboard/focus-time-stat.tsx:42`,
  `components/dashboard/focus-timer.tsx:88`,
  `components/dashboard/inbox-board.tsx:46`. São todos `setState`
  síncrono dentro de `useEffect` — requerem revisão de lógica de
  efeito (não de padrão de Server Action), fora do escopo desta etapa.
- 3 warnings de `no-unused-vars` pré-existentes (`Plus` e `HabitCard`
  em `app/(app)/semana/page.tsx`, `MoreVertical` em
  `components/dashboard/task-row.tsx`).

Esses itens continuam registrados na revisão técnica original como
Prioridade 2/3 e não fazem parte deste patch.

## Validação final

- `tsc --noEmit`: **0 erros**.
- `eslint .`: **0 erros/warnings novos** — os 4 erros e 3 warnings
  reportados são 100% pré-existentes (confirmado por `git diff` em
  cada arquivo apontado; nenhum deles foi tocado por esta
  refatoração, exceto `task-row.tsx`, onde o import não-usado já
  existia antes da minha edição).
- **Testes:** `pnpm test` (vitest) → `No test files found`. O
  projeto tem o script configurado mas **nenhum arquivo de teste
  existe** no repositório — isso já era assim antes desta
  refatoração, não é algo que esta etapa criou ou escondeu.
- **Build (`next build`):** não foi possível concluir neste
  ambiente — falha ao buscar as fontes `Geist`/`Geist Mono` do Google
  Fonts (`fonts.googleapis.com`), porque o sandbox onde rodei esta
  refatoração tem a rede restrita a um allowlist de domínios que não
  inclui `fonts.googleapis.com`. **Confirmei que essa falha é 100%
  ambiental, não relacionada ao código:** rodei `next build` também
  no commit base (`4256ae0`, sem nenhuma das minhas alterações) e o
  erro é idêntico. Em qualquer ambiente com acesso normal à internet
  (sua máquina local ou o VPS), esse build deve funcionar
  normalmente. Recomendo rodar `pnpm build` como o último gate antes
  de aplicar o patch, já que eu não consegui validar esse passo
  especificamente.

## Arquivos alterados nesta refatoração

Inclui tanto a refatoração arquitetural (Server Actions) quanto as
correções de segurança/produção da rodada anterior a ela, já que
ambas fazem parte do mesmo patch final.

**Criados:**
- `lib/validators/tag.ts`, `lib/validators/focus.ts`,
  `lib/validators/task.ts`, `lib/validators/week.ts`,
  `lib/validators/inbox.ts`, `lib/validators/waitlist.ts`
- `docs/refactoring/README.md` e `docs/refactoring/00` a `06-*.md`
- `scripts/legacy/README.md`

**Removidos:**
- `app/(dashboard)/inbox/actions.ts` (conteúdo movido, ver abaixo)

**Movidos:**
- `apply-0003.mjs`, `apply-0005.mjs`, `apply-0007.mjs`,
  `apply-focus-session.mjs`, `apply-migration.mjs`, `check-db.mjs`,
  `run-migration.mjs` → `scripts/legacy/`
- `app/(dashboard)/inbox/actions.ts` → `app/(app)/inbox/_actions/inbox-crud.ts`

**Modificados — infraestrutura de actions:**
- `lib/safe-action.ts`

**Modificados — actions migradas para next-safe-action:**
- `app/(app)/board/actions.ts` (só troca de client, sem mudança de lógica)
- `app/(app)/hoje/_actions/{complete,create,delete,update}-task.ts`,
  `{start,pause,resume,finish}-focus.ts`, `toggle-top-priority.ts`
- `app/(app)/semana/_actions/create-week-plan.ts`,
  `create-week-task.ts`, `toggle-habit.ts`, `toggle-week-goal.ts`
- `app/(app)/tags/actions.ts`
- `app/(app)/inbox/_actions/organize-inbox-task.ts`,
  `inbox-crud.ts` (novo caminho)
- `app/(auth)/login/_actions/waitlist.ts`

**Modificados — call sites (componentes client):**
- `components/dashboard/{new-tag-button,tag-actions}.tsx`
- `components/dashboard/focus-timer.tsx`,
  `components/dashboard/focus-task-checkbox.tsx`
- `components/dashboard/{create-task-button,task-actions,task-row}.tsx`,
  `components/board/work-task-card.tsx`
- `app/(app)/semana/_components/{quick-week-task,week-goal-item,week-habit-card,week-planner-dialog}.tsx`
- `components/dashboard/{new-inbox-task-button,edit-inbox-task-modal,inbox-task-menu,complete-inbox-task-button,inbox-board,inbox-task-actions}.tsx`
- `components/auth/waitlist-form.tsx`

**Modificados — correções de segurança/produção (rodada anterior a
esta refatoração, incluídas no mesmo patch):**
- `app/(app)/inbox/page.tsx` (estatísticas "Capturadas hoje"/"Pendentes
  de organizar")
- `docker-compose.yml` (credencial, porta, timezone)

## Próxima etapa

Nenhuma feature pendente. Este README reflete o estado final —
próximo passo é aplicar o `.patch` gerado a partir deste trabalho.
