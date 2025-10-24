# Sistema CASL de Permissões

## Estrutura Atual

O sistema CASL está configurado para validar permissões baseadas em:

- **Roles de usuário**: ADMIN ou USER
- **Recursos**: User, MCP
- **Ações**: manage, create, read, list, update, delete

## Permissões Configuradas

### ADMIN

- `manage` em `User` - Acesso total a operações de usuários
- `manage` em `MCP` - Acesso total ao MCP e todos os tools

### USER (Regular)

- `read` e `update` em `User` (apenas seu próprio usuário com `{ id: user.id }`)
- `read` e `update` em `MCP` (apenas com seu próprio `{ userId: user.id }`)
- **Explicitamente negado**: `list`, `create`, `delete` em `User`

## Como Usar

### No Controlador HTTP (REST API)

```typescript
@Get()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.List, 'User'))
async findAll() {
  return this.usersService.findAll();
}

@Get('/read/:id')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility, params: { id: string }) => {
  const userSubject = subject('User', { id: params.id });
  return ability.can(Action.Read, userSubject);
})
async findOne(@Param('id') id: string) {
  return this.usersService.findOne({ id });
}
```

### No Controlador MCP

O controlador MCP valida permissões em dois níveis:

1. **Conexão SSE**: Verifica se o usuário pode conectar ao MCP
2. **Execução de Tools**: Valida permissões específicas para cada tool antes de executar

```typescript
@Post('messages')
@UseGuards(JwtAuthGuard, PoliciesGuard)
@CheckPolicies((ability: AppAbility, _params: any, user: User) => {
  const mcpSubject = subject('MCP', { userId: user.id });
  return ability.can(Action.Read, mcpSubject);
})
async handleSse(@Req() req: Request & { user: User }, @Body() body: any) {
  // Validação adicional de permissões por tool
  if (body.method === 'tools/call') {
    const toolName = body.params.name;
    // Verifica permissão específica do tool baseado no TOOL_PERMISSIONS_MAP
  }
}
```

### Mapeamento de Tools MCP para Permissões CASL

Os tools do MCP são mapeados para ações CASL no controlador:

```typescript
const TOOL_PERMISSIONS_MAP = {
  listUsers: { action: Action.List, resource: 'User' },
  getUser: { action: Action.Read, resource: 'User', requiresId: true },
  getUserByEmail: { action: Action.Read, resource: 'User', requiresId: true },
  createUser: { action: Action.Create, resource: 'User' },
  updateUser: { action: Action.Update, resource: 'User', requiresId: true },
  deleteUser: { action: Action.Delete, resource: 'User', requiresId: true },
};
```

### Adicionando Novas Permissões

1. **Adicione nova ação** (se necessário) em `action.enum.ts`:

```typescript
export enum Action {
  Execute = 'execute', // Nova ação
  // ... outras ações
}
```

2. **Atualize o AbilityFactory** em `ability.factory.ts`:

```typescript
if (user?.role === 'ADMIN') {
  can(Action.Manage, 'MCP');
} else {
  can(Action.Read, 'MCP');
  can(Action.Execute, 'MCP', { userId: user.id }); // Permissão condicional
}
```

3. **Use no controlador**:

```typescript
@Post('execute')
@CheckPolicies((ability: AppAbility) =>
  ability.can(Action.Execute, 'MCP')
)
async executeTool(@Req() req: Request & { user: User }) {
  // Lógica aqui
}
```

## Permissões Condicionais

Para permissões baseadas em propriedades específicas:

```typescript
// No AbilityFactory
can(Action.Execute, 'Tool', { ownerId: user.id });

// No controlador
@CheckPolicies((ability: AppAbility, params: { id: string }) => {
  const toolSubject = subject('Tool', { id: params.id, ownerId: req.user.id });
  return ability.can(Action.Execute, toolSubject);
})
```

## Testando Permissões

### Usuário Regular (USER)

#### API REST

- ✅ `GET /api/users/read/:id` - Pode ler apenas seu próprio perfil
- ✅ `PATCH /api/users/:id` - Pode atualizar apenas seu próprio perfil
- ❌ `GET /api/users` - **NÃO pode** listar todos os usuários (403)
- ❌ `POST /api/users` - **NÃO pode** criar usuários (403)
- ❌ `DELETE /api/users/:id` - **NÃO pode** deletar usuários (403)
- ❌ **NÃO pode** acessar dados de outros usuários (403)

#### MCP Tools

- ✅ Pode conectar ao SSE (`GET /sse`)
- ✅ Pode executar `getUser` com seu próprio ID
- ✅ Pode executar `updateUser` com seu próprio ID
- ❌ **NÃO pode** executar `listUsers` (403)
- ❌ **NÃO pode** executar `createUser` (403)
- ❌ **NÃO pode** executar `deleteUser` (403)
- ❌ **NÃO pode** executar `getUser` com ID de outro usuário (403)

### Administrador (ADMIN)

#### API REST

- ✅ Acesso total a todas as rotas de usuários
- ✅ Pode listar, criar, ler, atualizar e deletar qualquer usuário

#### MCP Tools

- ✅ Acesso total ao MCP
- ✅ Pode executar todos os tools sem restrições
- ✅ Pode acessar dados de qualquer usuário

## Fluxo de Autenticação e Autorização

### API REST (HTTP Controllers)

1. **Autenticação**: `JwtAuthGuard` valida o token JWT
2. **Extração do usuário**: Token decodificado e usuário anexado ao `req.user`
3. **Autorização**: `PoliciesGuard` usa `AbilityFactory` para verificar permissões
4. **Validação**: `@CheckPolicies` verifica se o usuário tem permissão para a ação específica
5. **Execução**: Se autorizado, o método do controller é executado

### MCP (Tools via SSE)

1. **Conexão SSE**: Autenticação via JWT no header
2. **Validação MCP**: `@CheckPolicies` verifica permissão de acesso ao MCP baseado em `userId`
3. **Recebimento de mensagem**: `POST /messages` com `method: 'tools/call'`
4. **Validação de Tool**: Controller verifica permissão específica do tool no `TOOL_PERMISSIONS_MAP`
5. **Verificação de ID**: Para tools que requerem ID, valida se é o ID do próprio usuário
6. **Execução**: Se autorizado, o tool é executado via `McpSseService`
7. **Resposta**: Resultado enviado via SSE

## Arquitetura de Módulos

```
AppModule
├── ConfigModule
├── UsersModule (importa CaslModule)
│   ├── UsersController (@UseGuards(JwtAuthGuard, PoliciesGuard))
│   └── UsersService (@Tool decorators para MCP)
├── AuthModule
│   ├── AuthController (login)
│   ├── AuthService
│   ├── JwtAuthGuard
│   └── JwtStrategy
├── CaslModule (exporta AbilityFactory)
│   ├── AbilityFactory (define permissões por role)
│   ├── PoliciesGuard (valida @CheckPolicies)
│   └── check-policies.decorator
└── McpSseModule (importa CaslModule)
    └── CustomSseController
        ├── @UseGuards(JwtAuthGuard, PoliciesGuard)
        ├── Validação de permissões por tool
        └── McpSseService (executa tools)
```

## Testes E2E

Execute `pnpm test:e2e` para validar todas as permissões:

```bash
# Todas as permissões são testadas
✓ ADMIN pode listar/criar/ler/atualizar/deletar usuários
✓ USER NÃO pode listar todos os usuários (403)
✓ USER pode apenas ler/atualizar seu próprio perfil
✓ USER NÃO pode acessar outros usuários (403)
✓ Rejeita requisições sem token (401)
```

Veja mais detalhes em `/test/README.md`
