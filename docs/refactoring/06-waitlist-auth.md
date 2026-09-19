# 06 — Waitlist (auth)

**Status:** ✅ concluído e validado (typecheck ok)

## Antes

`app/(auth)/login/_actions/waitlist.ts` — sem sessão (é uma action
pública, de landing page, corretamente sem checagem de auth), sem
Zod, retornando um shape próprio `{ success, message }` em vez de
lançar erro.

## Depois

- **Criado** `lib/validators/waitlist.ts`: `addToWaitlistSchema`
  (`name`, `email` com `.email()`, `phone`), substituindo os
  `if (!name.trim() || ...)` manuais.
- Reescrito como `actionClient.inputSchema(...).action(...)` — usa o
  `actionClient` **base** (sem `authActionClient`), porque é uma
  action pública de cadastro na waitlist, sem usuário autenticado.
  Isso é intencional e diferente das demais features: nem toda action
  do projeto deve exigir sessão, e o padrão do Board já deixava essa
  distinção disponível via `actionClient` vs `authActionClient` (aqui
  ampliada com `authBoardActionClient` na Feature 00).
- A regra de negócio "e-mail já cadastrado" agora é um `throw new
  Error(...)`, no mesmo padrão usado em `toggle-top-priority.ts`
  ("3 prioridades") — em vez do shape customizado `{ success: false,
  message }`.

## Call sites atualizados

- `components/auth/waitlist-form.tsx` — antes lia
  `result.success`/`result.message`; agora lê
  `result?.serverError` (erro de negócio, ex.: e-mail duplicado),
  `result?.validationErrors` (campo inválido) e
  `result?.data?.message` (sucesso).

## Pendências

Nenhuma.

## Próxima etapa

Nenhuma — esta era a última feature do plano. Seguir para validação
final (typecheck completo, lint, testes, build) e geração do patch.
