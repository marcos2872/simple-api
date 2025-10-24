# Sistema CASL de Permissões

## Estrutura Atual

O sistema CASL está configurado para validar permissões baseadas em:

- **Roles de usuário**: ADMIN ou USER
- **Recursos**: User, MCP
- **Ações**: manage, create, read, list, update, delete

## Permissões Configuradas

### ADMIN

- `manage` em `User` - Acesso total a operações de usuários
- `manage` em `MCP` - Acesso total ao MCP

### USER (Regular)

- `read` e `update` em `User` (apenas seu próprio usuário)
- `read` em `MCP` - Acesso de leitura ao MCP

## Como Usar

### No Controlador MCP

```typescript
@Get('sse')
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'MCP'))
async connectionSse(@Req() req: Request & { user: User }, @Res() res: Response) {
  // Somente usuários com permissão de leitura no MCP podem conectar
}
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

- ✅ Pode conectar ao SSE (`GET /sse`)
- ✅ Pode enviar mensagens MCP (`POST /messages`)
- ✅ Pode ler seu próprio perfil
- ✅ Pode atualizar seu próprio perfil
- ❌ Não pode gerenciar outros usuários

### Administrador (ADMIN)

- ✅ Acesso total ao MCP
- ✅ Acesso total a todos os usuários
- ✅ Pode criar, ler, atualizar e deletar qualquer recurso

## Fluxo de Autenticação e Autorização

1. **Autenticação**: `JwtAuthGuard` valida o token JWT
2. **Extração do usuário**: Token decodificado e usuário anexado ao `req.user`
3. **Autorização**: `PoliciesGuard` usa `AbilityFactory` para verificar permissões
4. **Validação**: `@CheckPolicies` verifica se o usuário tem permissão para a ação específica
