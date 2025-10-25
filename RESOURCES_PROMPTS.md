# Resources e Prompts no Servidor MCP

Este documento explica como implementamos **Resources** e **Prompts** no servidor MCP do projeto Simple API.

## Overview

O Model Context Protocol (MCP) suporta três tipos principais de componentes:

1. **Tools**: Funções que podem ser executadas (já implementado no `UsersService`)
2. **Resources**: Dados estáticos ou dinâmicos que podem ser acessados
3. **Prompts**: Templates para geração de conteúdo ou análises

## Resources Implementados

Os Resources fornecem acesso a dados e documentação do sistema através de URIs específicos.

### Localização

```
src/mcp/services/resources.service.ts
```

### Resources Disponíveis

#### 1. Schemas Prisma

- **URI**: `schema://prisma/user`
- **Descrição**: Schema do modelo User
- **Permissão**: Público (todos os usuários autenticados)

- **URI**: `schema://prisma/full`
- **Descrição**: Schema completo do Prisma
- **Permissão**: Admin apenas

#### 2. Configurações da API

- **URI**: `config://api/endpoints`
- **Descrição**: Documentação dos endpoints da API
- **Permissão**: Público

- **URI**: `config://casl/permissions`
- **Descrição**: Matriz de permissões CASL
- **Permissão**: Admin apenas

#### 3. Estatísticas

- **URI**: `stats://users/summary`
- **Descrição**: Estatísticas dos usuários
- **Permissão**: Admin apenas

#### 4. Documentação

- **URI**: `docs://api/getting-started`
- **Descrição**: Guia de início rápido da API
- **Permissão**: Público

- **URI**: `docs://mcp/protocol`
- **Descrição**: Documentação do protocolo MCP
- **Permissão**: Público

### Exemplo de Uso

```json
{
  "method": "resources/read",
  "params": {
    "uri": "schema://prisma/user"
  }
}
```

## Prompts Implementados

Os Prompts fornecem templates para geração de análises e relatórios.

### Localização

```
src/mcp/services/prompts.service.ts
```

### Prompts Disponíveis

#### 1. user-analysis

- **Descrição**: Analisa padrões e comportamento de usuários
- **Parâmetros**:
  - `userId` (opcional): ID específico do usuário
  - `timeframe` (opcional): Período de análise (7d, 30d, 90d, 1y)
  - `includeMetrics` (opcional): Incluir métricas detalhadas
- **Permissão**: Público

#### 2. user-report

- **Descrição**: Gera relatório abrangente de usuários
- **Parâmetros**:
  - `userId` (opcional): ID específico do usuário
  - `format` (opcional): Formato do relatório (summary, detailed, technical)
  - `includePermissions` (opcional): Incluir análise de permissões
- **Permissão**: Público

#### 3. security-audit

- **Descrição**: Gera prompt para auditoria de segurança
- **Parâmetros**:
  - `scope` (opcional): Escopo da auditoria (users, permissions, full)
  - `severity` (opcional): Nível mínimo de severidade (low, medium, high, critical)
- **Permissão**: Admin apenas

### Exemplo de Uso

```json
{
  "method": "prompts/get",
  "params": {
    "name": "user-analysis",
    "arguments": {
      "userId": "user_123",
      "timeframe": "30d",
      "includeMetrics": "true"
    }
  }
}
```

## Sistema de Permissões

### Ações Adicionadas

Foram adicionadas duas novas ações ao enum `Action`:

- `Access`: Para acessar resources
- `Execute`: Para executar prompts

### Mapeamento de Permissões

#### Resources

```typescript
const RESOURCE_PERMISSIONS_MAP = {
  'schema://prisma/user': { action: Action.Access },
  'schema://prisma/full': { action: Action.Access, adminOnly: true },
  'config://api/endpoints': { action: Action.Access },
  'config://casl/permissions': { action: Action.Access, adminOnly: true },
  'stats://users/summary': { action: Action.Access, adminOnly: true },
  'docs://api/getting-started': { action: Action.Access },
  'docs://mcp/protocol': { action: Action.Access },
};
```

#### Prompts

```typescript
const PROMPT_PERMISSIONS_MAP = {
  'user-analysis': { action: Action.Execute },
  'user-report': { action: Action.Execute },
  'security-audit': { action: Action.Execute, adminOnly: true },
};
```

### Regras de Acesso

#### Admin

- Acesso total a todos os resources e prompts
- `can(Action.Manage, 'Resource')`
- `can(Action.Manage, 'Prompt')`

#### Usuário Regular

- Acesso apenas a resources públicos
- Acesso apenas a prompts públicos
- Bloqueado para resources/prompts com `adminOnly: true`

```typescript
// Resources
can(Action.Access, 'Resource', { public: true });
can(Action.Access, 'Resource', { userId: user.id });
cannot(Action.Access, 'Resource', { adminOnly: true });

// Prompts
can(Action.Execute, 'Prompt', { public: true });
can(Action.Execute, 'Prompt', { userId: user.id });
cannot(Action.Execute, 'Prompt', { adminOnly: true });
```

## Implementação Técnica

### Decorators Utilizados

- `@Resource()`: Para marcar métodos que fornecem resources
- `@Prompt()`: Para marcar métodos que fornecem prompts

### Estrutura dos Decorators

```typescript
@Resource({
  uri: 'unique-uri',
  name: 'Display Name',
  description: 'Description of the resource',
  mimeType: 'text/plain' | 'application/json' | 'text/markdown',
})

@Prompt({
  name: 'prompt-name',
  description: 'Description of the prompt',
  parameters: z.object({
    param1: z.string().optional().describe('Parameter description'),
    // ...
  }),
})
```

### Validação de Permissões no Controller

O controlador MCP (`src/mcp/controllers/mcp.controlle.ts`) foi atualizado para validar permissões para:

1. **resources/read**: Valida acesso ao resource específico
2. **prompts/get**: Valida permissão para executar o prompt
3. **tools/call**: Validação existente para tools

## Integração no Módulo MCP

Os novos serviços foram registrados no módulo MCP:

```typescript
@Module({
  // ...
  providers: [ResourcesService, PromptsService, PrismaService],
  exports: [ResourcesService, PromptsService],
})
export class McpSseModule {}
```

## Testando a Implementação

### 1. Testando Resources

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

### 2. Testando Prompts

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

### 3. Verificando Permissões

- Usuários regulares não devem conseguir acessar resources/prompts com `adminOnly: true`
- Tentativas não autorizadas devem retornar erro 403 Forbidden

## Benefícios da Implementação

1. **Acesso Estruturado a Dados**: AI assistants podem acessar schemas, configurações e estatísticas de forma organizada
2. **Templates Inteligentes**: Prompts fornecem contexto rico para análises e relatórios
3. **Segurança Granular**: Sistema de permissões baseado em roles controla acesso
4. **Extensibilidade**: Fácil adicionar novos resources e prompts
5. **Padronização**: Seguindo o protocolo MCP standard

## Próximos Passos

1. **Adicionar mais Resources**: Logs, métricas de performance, configurações do sistema
2. **Expandir Prompts**: Templates para diferentes tipos de análises e relatórios
3. **Cache de Resources**: Implementar cache para resources estáticos
4. **Monitoramento**: Adicionar logs de acesso a resources e prompts
5. **Testes Automatizados**: Criar testes e2e para validar permissões

## Arquivos Modificados

1. `src/mcp/services/resources.service.ts` - Novo serviço de resources
2. `src/mcp/services/prompts.service.ts` - Novo serviço de prompts
3. `src/mcp/mcp.module.ts` - Registrar novos serviços
4. `src/casl/action.enum.ts` - Adicionar ações Access e Execute
5. `src/casl/ability.factory.ts` - Atualizar permissões para resources e prompts
6. `src/casl/policies.guard.ts` - Atualizar tipos para incluir Resource e Prompt
7. `src/mcp/controllers/mcp.controlle.ts` - Adicionar validação de permissões

Esta implementação fornece uma base sólida para fornecer contexto rico e estruturado para AI assistants através do protocolo MCP, mantendo a segurança e controle de acesso apropriados.
