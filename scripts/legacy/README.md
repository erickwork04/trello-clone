# ⚠️ Scripts legados — não usar

Estes scripts aplicavam migrations manualmente via `sql.unsafe()`, **fora**
da tabela de controle do Drizzle Kit (`__drizzle_migrations`). Eles foram
usados no passado, mas criam risco real de dessincronia entre o estado do
banco e o histórico de migrations — especialmente com deploy automatizado.

**Fluxo correto, sempre:**

```bash
pnpm db:generate   # gera a migration a partir do schema
pnpm db:migrate     # aplica via drizzle-kit, registrando no histórico
```

Não execute nenhum arquivo desta pasta em produção. Eles estão aqui apenas
como referência histórica e serão removidos numa limpeza futura.
