# E2E Tests

## 📋 Visão Geral

Os testes E2E validam o sistema completo de autenticação e autorização CASL, garantindo que:

- Usuários ADMIN têm acesso total
- Usuários regulares (USER) só acessam seus próprios dados
- Permissões são corretamente aplicadas em todas as rotas
- Sistema rejeita requisições não autenticadas

## 🚀 Setup

Os testes e2e usam um banco de dados PostgreSQL separado para garantir isolamento.

### Configuração do Banco de Testes

1. O banco de testes é configurado via arquivo `.env.test`
2. As migrations são aplicadas antes dos testes via `pnpm test:e2e:setup`

### Executar os Testes

```bash
# Primeira vez - Configurar banco de testes e aplicar migrations
pnpm test:e2e:setup

# Executar todos os testes E2E
pnpm test:e2e

# Executar testes específicos
pnpm test:e2e -- users.e2e-spec

# Executar com cobertura
pnpm test:e2e -- --coverage
```

## 📊 Resultados dos Testes

```
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Time:        ~1.2s
```

## 📝 Cobertura dos Testes

### `users.e2e-spec.ts`

Valida todas as regras de permissão CASL para usuários nas rotas HTTP e garante que o sistema de autorização funciona corretamente.

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

## 🏗️ Estrutura dos Testes

```
test/
├── test-helper.ts          # Utilitários para setup/cleanup
├── users.e2e-spec.ts       # Testes de permissões de usuários
├── jest-e2e.json          # Configuração Jest para E2E
└── README.md              # Esta documentação
```

### Arquivos Importantes

#### `test-helper.ts`

Fornece funções utilitárias para:

- Setup do banco de dados de teste
- Limpeza entre testes
- Criação de usuários de teste (ADMIN e USER)
- Geração de tokens JWT para testes

```typescript
export const setupTestDb = async () => {
  /* ... */
};
export const cleanupTestDb = async () => {
  /* ... */
};
export const createTestUsers = async () => {
  /* ... */
};
```

#### `users.e2e-spec.ts`

Testa todos os endpoints de usuários com diferentes roles:

- Setup antes de todos os testes (cria usuários ADMIN e USER)
- Cleanup após todos os testes
- Testes organizados por role e funcionalidade

## 🔍 Detalhes dos Testes

### ADMIN Permissions (5 testes)

```typescript
describe('ADMIN permissions', () => {
  it('should list all users'); // GET /api/users
  it('should view any user'); // GET /api/users/read/:id
  it('should create a new user'); // POST /api/users
  it('should update any user'); // PATCH /api/users/:id
  it('should delete any user'); // DELETE /api/users/:id
});
```

### USER Permissions (7 testes)

```typescript
describe('USER permissions', () => {
  it('should NOT list all users'); // 403 Forbidden
  it('should view own user profile'); // 200 OK (próprio ID)
  it('should NOT view other users'); // 403 Forbidden (outro ID)
  it('should update own profile'); // 200 OK (próprio ID)
  it('should NOT update other users'); // 403 Forbidden (outro ID)
  it('should NOT create users'); // 403 Forbidden
  it('should NOT delete any user'); // 403 Forbidden
});
```

### Authentication (2 testes)

```typescript
describe('Authentication', () => {
  it('should reject requests without token'); // 401 Unauthorized
  it('should reject invalid tokens'); // 401 Unauthorized
});
```

## 🎯 Casos de Teste Cobertos

| Caso                                | ADMIN  | USER   | Sem Auth |
| ----------------------------------- | ------ | ------ | -------- |
| `GET /api/users` (listar todos)     | ✅ 200 | ❌ 403 | ❌ 401   |
| `GET /api/users/read/:id` (próprio) | ✅ 200 | ✅ 200 | ❌ 401   |
| `GET /api/users/read/:id` (outro)   | ✅ 200 | ❌ 403 | ❌ 401   |
| `POST /api/users` (criar)           | ✅ 201 | ❌ 403 | ❌ 401   |
| `PATCH /api/users/:id` (próprio)    | ✅ 200 | ✅ 200 | ❌ 401   |
| `PATCH /api/users/:id` (outro)      | ✅ 200 | ❌ 403 | ❌ 401   |
| `DELETE /api/users/:id`             | ✅ 200 | ❌ 403 | ❌ 401   |

## 🔧 Configuração

### `.env.test`

O banco de teste deve ser configurado separadamente:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/simple_api_test"
JWT_SECRET="test-secret-key"
JWT_EXPIRES_IN="1d"
```

### `jest-e2e.json`

Configuração do Jest para testes E2E:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## 🚨 Troubleshooting

### Erro: "Cannot connect to database"

Certifique-se de que:

1. PostgreSQL está rodando
2. Banco de teste está criado
3. `.env.test` está configurado corretamente
4. Migrations foram aplicadas: `pnpm test:e2e:setup`

### Erro: "Cannot find module"

Execute:

```bash
pnpm install
pnpm prisma generate
```

### Testes falhando após mudanças no schema

Reaplicar migrations no banco de teste:

```bash
pnpm test:e2e:setup
```

## 📈 Próximos Passos

Potenciais adições aos testes:

- [ ] Testes de integração MCP (tools via SSE)
- [ ] Testes de performance com múltiplos usuários
- [ ] Testes de validação de dados (schemas Zod)
- [ ] Testes de rate limiting
- [ ] Testes de refresh tokens

## 📚 Recursos Relacionados

- [Sistema CASL](../src/casl/README.md) - Documentação completa de permissões
- [Testes de Permissões MCP](../PERMISSIONS-TEST.md) - Como testar tools MCP
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing) - Documentação oficial
