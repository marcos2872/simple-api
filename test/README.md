# E2E Tests

## Setup

Os testes e2e usam um banco de dados PostgreSQL separado para garantir isolamento.

### Configuração do Banco de Testes

1. O banco de testes é configurado via arquivo `.env.test`
2. As migrations são aplicadas antes dos testes via `pnpm test:e2e:setup`

### Executar os Testes

```bash
# Aplicar migrations no banco de testes (primeira vez)
pnpm test:e2e:setup

# Executar os testes e2e
pnpm test:e2e
```

## Cobertura dos Testes

### `users.e2e-spec.ts`

Valida as regras de permissão CASL para usuários:

#### ADMIN Permissions

- ✅ Pode listar todos os usuários (GET /api/users)
- ✅ Pode visualizar qualquer usuário (GET /api/users/read/:id)
- ✅ Pode criar novos usuários (POST /api/users)
- ✅ Pode atualizar qualquer usuário (PATCH /api/users/:id)
- ✅ Pode deletar qualquer usuário (DELETE /api/users/:id)

#### USER Permissions

- ✅ NÃO pode listar todos os usuários (403)
- ✅ Pode visualizar apenas o próprio perfil
- ✅ NÃO pode visualizar outros usuários (403)
- ✅ Pode atualizar apenas o próprio perfil
- ✅ NÃO pode atualizar outros usuários (403)
- ✅ NÃO pode criar usuários (403)
- ✅ NÃO pode deletar usuários, nem o próprio (403)

#### Authentication

- ✅ Rejeita requisições sem token (401)
- ✅ Rejeita tokens inválidos (401)

## Estrutura dos Testes

- `test/test-helper.ts` - Utilitário para setup/cleanup do banco de testes
- `test/users.e2e-spec.ts` - Testes das permissões de usuários
- `.env.test` - Configuração do ambiente de testes
