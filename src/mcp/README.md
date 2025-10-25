# Módulo MCP (Model Context Protocol)

Este módulo implementa o protocolo MCP completo para fornecer acesso estruturado e seguro ao sistema de gerenciamento de usuários através de Tools, Resources e Prompts.

## Status da Implementação

- ✅ **Tools**: Operações CRUD no sistema de usuários
- ✅ **Resources**: Acesso a dados, configurações e documentação
- ✅ **Prompts**: Templates para análise e relatórios
- ✅ **Autenticação**: JWT + SSE com validação contínua
- ✅ **Autorização**: Sistema CASL com permissões granulares
- ✅ **Formato MCP**: Retornos padronizados conforme protocolo

## Estrutura do Módulo

```
src/mcp/
├── controllers/
│   └── mcp.controlle.ts          # Controller SSE com validação de permissões
├── services/
│   ├── resources.service.ts      # Serviço de Resources
│   └── prompts.service.ts        # Serviço de Prompts
└── mcp.module.ts                 # Configuração do módulo
```

## Componentes MCP Implementados

### 1. Tools (Ferramentas)

Implementado no `UsersService` (`src/users/users.service.ts`)

**Disponíveis:**

- `listUsers` - Listar todos os usuários (ADMIN apenas)
- `getUser` - Obter usuário por ID (próprio perfil ou ADMIN)
- `getUserByEmail` - Obter usuário por email (próprio perfil ou ADMIN)
- `createUser` - Criar novo usuário (ADMIN apenas)
- `updateUser` - Atualizar usuário (próprio perfil ou ADMIN)
- `deleteUser` - Deletar usuário (ADMIN apenas)

### 2. Resources (Recursos) ✨

Implementado no `ResourcesService` - Fornecem dados estruturados

**📄 Schemas:**

- `schema://prisma/user` - Schema do modelo User (🟢 Público)
- `schema://prisma/full` - Schema completo do Prisma (🔴 ADMIN)

**⚙️ Configurações:**

- `config://api/endpoints` - Documentação completa dos endpoints (🟢 Público)
- `config://casl/permissions` - Matriz de permissões CASL (🔴 ADMIN)

**📊 Estatísticas:**

- `stats://users/summary` - Métricas e estatísticas de usuários (🔴 ADMIN)

**📚 Documentação:**

- `docs://api/getting-started` - Guia de início da API (🟢 Público)
- `docs://mcp/protocol` - Documentação do protocolo MCP (🟢 Público)

### 3. Prompts (Templates) ✨

Implementado no `PromptsService` - Templates para análise e relatórios

**🔍 Análise:**

- `user-analysis` - Análise de padrões de usuários com métricas (🟢 Público)

**📊 Relatórios:**

- `user-report` - Relatório abrangente de usuários (🟢 Público)

**🛡️ Segurança:**

- `security-audit` - Auditoria de segurança do sistema (🔴 ADMIN)

## Correções de Formato Implementadas

### Problema Resolvido

Os Resources e Prompts retornavam strings vazias ao cliente devido ao formato incorreto de retorno.

**Antes (❌ Incorreto):**

```typescript
// Resources retornavam apenas strings
return JSON.stringify(data);

// Prompts retornavam apenas strings
return promptText;
```

**Depois (✅ Correto):**

```typescript
// Resources seguem formato MCP
return {
  contents: [
    {
      uri: 'config://api/endpoints',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    },
  ],
};

// Prompts seguem formato MCP
return {
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: promptText,
      },
    },
  ],
};
```

### Resultado

- ✅ Resources agora retornam conteúdo completo estruturado
- ✅ Prompts agora retornam templates processados corretamente
- ✅ Compatibilidade total com protocolo MCP
- ✅ Logs mostram dados sendo processados corretamente

## Autenticação e Autorização

### Fluxo de Autenticação

1. **Conexão SSE**: `GET /sse` com JWT no header
2. **Validação JWT**: Token decodificado e usuário anexado
3. **Mensagens MCP**: `POST /messages` com validação de permissões

### Sistema de Permissões

Baseado no CASL (Code Access Security Layer):

#### Ações Disponíveis

- `manage` - Controle total (ADMIN apenas)
- `create`, `read`, `list`, `update`, `delete` - Operações CRUD
- `access` - Acessar resources
- `execute` - Executar prompts

#### Roles e Permissões

**ADMIN:**

- Acesso total a todos os tools, resources e prompts
- `can(Action.Manage, 'User|MCP|Resource|Prompt')`

**USER:**

- Acesso limitado ao próprio perfil
- Resources públicos apenas
- Prompts públicos apenas
- Bloqueado para operações administrativas

## Exemplos de Uso

### Conectar ao MCP via SSE

```bash
curl -X GET http://localhost:3000/sse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: text/event-stream"
```

### Executar Tool

```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "getUser",
      "arguments": {
        "id": "YOUR_USER_ID"
      }
    }
  }'
```

### Acessar Resource

```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "resources/read",
    "params": {
      "uri": "schema://prisma/user"
    }
  }'
```

### Executar Prompt

```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "prompts/get",
    "params": {
      "name": "user-analysis",
      "arguments": {
        "timeframe": "30d",
        "includeMetrics": "true"
      }
    }
  }'
```

## Segurança

### Validação de Permissões

O controller MCP valida permissões em três níveis:

1. **Conexão MCP**: Usuário deve ter permissão `Read` em `MCP`
2. **Tool Execution**: Cada tool é mapeado para ações CASL específicas
3. **Resource/Prompt Access**: Validação baseada em flags `adminOnly`

### Mapeamento de Permissões

**Tools:**

```typescript
const TOOL_PERMISSIONS_MAP = {
  listUsers: { action: Action.List, resource: 'User' },
  getUser: { action: Action.Read, resource: 'User', requiresId: true },
  // ...
};
```

**Resources:**

```typescript
const RESOURCE_PERMISSIONS_MAP = {
  'schema://prisma/user': { action: Action.Access },
  'schema://prisma/full': { action: Action.Access, adminOnly: true },
  // ...
};
```

**Prompts:**

```typescript
const PROMPT_PERMISSIONS_MAP = {
  'user-analysis': { action: Action.Execute },
  'security-audit': { action: Action.Execute, adminOnly: true },
  // ...
};
```

### Controle Contextual

- Usuários podem acessar apenas seus próprios dados
- Validação de ID para operações que requerem identificação
- Bloqueio automático para resources/prompts administrativos

## Logs e Debugging

O módulo inclui logging extensivo para:

- Conexões SSE estabelecidas
- Mensagens MCP recebidas
- Validações de permissão
- Execução de tools/resources/prompts

Nível de log: `DEBUG` para desenvolvimento, `LOG` para informações gerais

## Tratamento de Erros

**Códigos de Erro:**

- `401 Unauthorized` - Token JWT inválido ou ausente
- `403 Forbidden` - Permissões insuficientes
- `404 Not Found` - Tool/Resource/Prompt não encontrado
- `422 Unprocessable Entity` - Parâmetros inválidos

**Mensagens de Erro:**

- Em português para melhor UX
- Incluem o nome específico do tool/resource/prompt negado
- Logs detalhados para debugging

## Configuração

### Dependências

- `@rekog/mcp-nest` - Framework MCP para NestJS
- `@casl/ability` - Sistema de autorização
- `zod` - Validação de schemas

### Módulo

```typescript
McpModule.forRoot({
  name: 'simple-api',
  version: '1.0.0',
  transport: [], // SSE handled by custom controller
});
```

## Desenvolvimento

### Adicionando Novos Tools

1. Adicionar método com decorator `@Tool` no serviço apropriado
2. Atualizar `TOOL_PERMISSIONS_MAP` no controller
3. Definir permissões no `AbilityFactory`

### Adicionando Novos Resources

1. Adicionar método com decorator `@Resource` no `ResourcesService`
2. Atualizar `RESOURCE_PERMISSIONS_MAP` no controller
3. Definir se é público ou `adminOnly`

### Adicionando Novos Prompts

1. Adicionar método com decorator `@Prompt` no `PromptsService`
2. Atualizar `PROMPT_PERMISSIONS_MAP` no controller
3. Definir parâmetros com validação Zod

### Testes

Execute os testes e2e para validar permissões:

```bash
pnpm test:e2e
```

## Referências

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [CASL Documentation](https://casl.js.org/)
- [NestJS Documentation](https://docs.nestjs.com/)
