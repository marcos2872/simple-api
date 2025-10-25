# Resources e Prompts no Servidor MCP

Este documento explica como implementamos **Resources** e **Prompts** no servidor MCP do projeto Simple API, incluindo correções de formato e validações de permissão.

## Overview

O Model Context Protocol (MCP) suporta três tipos principais de componentes:

1. **Tools**: Funções que podem ser executadas (implementado no `UsersService`)
2. **Resources**: Dados estáticos ou dinâmicos que podem ser acessados ✨ **IMPLEMENTADO**
3. **Prompts**: Templates para geração de conteúdo ou análises ✨ **IMPLEMENTADO**

## Arquitetura da Implementação

### Estrutura de Arquivos

```
src/mcp/
├── controllers/
│   └── mcp.controlle.ts           # Controller SSE com validação de permissões
├── services/
│   ├── resources.service.ts       # Implementação dos Resources
│   └── prompts.service.ts         # Implementação dos Prompts
├── mcp.module.ts                  # Configuração do módulo
└── README.md                      # Documentação específica do MCP
```

### Fluxo de Validação

1. **Autenticação JWT**: Token validado no SSE
2. **Permissão MCP**: Usuário deve ter acesso ao MCP
3. **Validação Específica**: Cada resource/prompt tem suas próprias regras
4. **Execução**: Component é executado e retornado

## Resources Implementados

Os Resources fornecem acesso a dados e documentação através de URIs específicos, retornando no formato padrão MCP:

```typescript
{
  contents: [
    {
      uri: string,
      mimeType: string,
      text: string
    }
  ]
}
```

## Resources Implementados

Os Resources fornecem acesso a dados e documentação do sistema através de URIs específicos.

### Localização

```
src/mcp/services/resources.service.ts
```

### Resources Disponíveis

#### 1. Schemas do Banco de Dados

**📄 Schema do User**
- **URI**: `schema://prisma/user`
- **Descrição**: Schema do modelo User do Prisma
- **Mime Type**: `text/plain`
- **Permissão**: 🟢 Público (todos os usuários autenticados)
- **Conteúdo**: Schema Prisma específico do model User

**📄 Schema Completo**
- **URI**: `schema://prisma/full`
- **Descrição**: Schema completo do Prisma
- **Mime Type**: `text/plain`
- **Permissão**: 🔴 Admin apenas
- **Conteúdo**: Arquivo `schema.prisma` completo

#### 2. Configurações da API

**⚙️ Endpoints da API**
- **URI**: `config://api/endpoints`
- **Descrição**: Lista completa de endpoints disponíveis
- **Mime Type**: `application/json`
- **Permissão**: 🟢 Público
- **Conteúdo**: JSON estruturado com todos os endpoints, métodos, permissões e exemplos

**⚙️ Matriz de Permissões CASL**
- **URI**: `config://casl/permissions`
- **Descrição**: Mapeamento completo de permissões por role
- **Mime Type**: `application/json`
- **Permissão**: 🔴 Admin apenas
- **Conteúdo**: Estrutura detalhada das permissões ADMIN vs USER

#### 3. Estatísticas do Sistema

**📊 Resumo de Usuários**
- **URI**: `stats://users/summary`
- **Descrição**: Estatísticas gerais dos usuários
- **Mime Type**: `application/json`
- **Permissão**: 🔴 Admin apenas
- **Conteúdo**: Contadores, distribuição por role, métricas de crescimento

**📚 Guia de Início**
- **URI**: `docs://api/getting-started`
- **Descrição**: Tutorial passo-a-passo para usar a API
- **Mime Type**: `text/markdown`
- **Permissão**: 🟢 Público
- **Conteúdo**: Guia completo com autenticação, endpoints, exemplos de código

**📚 Documentação MCP**
- **URI**: `docs://mcp/protocol`
- **Descrição**: Documentação detalhada da implementação MCP
- **Mime Type**: `text/markdown`
- **Permissão**: 🟢 Público
- **Conteúdo**: Arquitetura, fluxos, exemplos, melhores práticas

### Exemplo de Uso de Resource

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "resources/read",
    "params": {
      "uri": "config://api/endpoints"
    }
  }'
```

**Resposta:**
```json
{
  "contents": [
    {
      "uri": "config://api/endpoints",
      "mimeType": "application/json",
      "text": "{\n  \"auth\": {\n    \"login\": {\n      \"method\": \"POST\",\n      \"path\": \"/api/auth/login\",\n      \"description\": \"Authenticate user and get JWT token\"\n    }\n  },\n  \"users\": {\n    ...\n  }\n}"
    }
  ]
}
```

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

Os Prompts fornecem templates para análises e relatórios de IA, retornando no formato padrão MCP:

```typescript
{
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: string  // Template processado
      }
    }
  ]
}
```

### Localização

```
src/mcp/services/prompts.service.ts
```

### Prompts Disponíveis

#### 🔍 Análise de Usuários

**Prompt**: `user-analysis`
- **Descrição**: Gera templates para análise de padrões e comportamento de usuários
- **Permissão**: 🟢 Público (dados filtrados por contexto do usuário)
- **Parâmetros**:
  - `userId` (opcional): ID específico do usuário para análise individual
  - `timeframe` (opcional): Período de análise - `7d`, `30d`, `90d`, `1y` (padrão: `30d`)
  - `includeMetrics` (opcional): Incluir métricas detalhadas - `true`/`false` (padrão: `true`)

**Funcionalidades:**
- Análise individual com dados específicos do usuário
- Análise geral do sistema com estatísticas agregadas
- Cálculo automático de métricas de crescimento
- Geração de questões de análise contextual

#### 📊 Relatório de Usuários

**Prompt**: `user-report`
- **Descrição**: Gera templates para relatórios abrangentes de usuários
- **Permissão**: 🟢 Público (dados filtrados por contexto do usuário)
- **Parâmetros**:
  - `userId` (opcional): ID específico do usuário para relatório individual
  - `format` (opcional): Formato do relatório - `summary`, `detailed`, `technical` (padrão: `summary`)
  - `includePermissions` (opcional): Incluir análise de permissões - `true`/`false` (padrão: `false`)

**Funcionalidades:**
- Relatórios individuais com perfil completo
- Relatórios sistema-wide com distribuição de usuários
- Múltiplos formatos de saída
- Análise de permissões opcional

#### 🛡️ Auditoria de Segurança

**Prompt**: `security-audit`
- **Descrição**: Gera templates para auditoria de segurança do sistema
- **Permissão**: 🔴 Admin apenas
- **Parâmetros**:
  - `scope` (opcional): Escopo da auditoria - `users`, `permissions`, `full` (padrão: `full`)
  - `severity` (opcional): Nível mínimo - `low`, `medium`, `high`, `critical` (padrão: `medium`)

**Funcionalidades:**
- Análise de distribuição de contas admin
- Auditoria de estrutura de permissões
- Recomendações de segurança
- Identificação de riscos potenciais

### Exemplo de Uso de Prompt

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "prompts/get",
    "params": {
      "name": "user-analysis",
      "arguments": {
        "userId": "user_123",
        "timeframe": "30d",
        "includeMetrics": "true"
      }
    }
  }'
```

**Resposta:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "# User Analysis Report\n\n## Analysis Parameters\n- **Timeframe**: 30d (last 30 days)\n- **Date Range**: 25/09/2025 to 25/10/2025\n- **Include Metrics**: true\n\n## Instructions for AI Assistant\n\nYou are analyzing user data from our application...\n\n### Single User Analysis: John Doe\n\n**User Details:**\n- ID: user_123\n- Email: john@example.com\n- Role: USER\n- Account Created: 15/09/2025\n- Last Updated: 20/10/2025\n- Account Age: 40 days\n\n**Analysis Questions:**\n1. How active has this user been based on their account age?\n2. What insights can you provide about their role and permissions?\n3. Are there any patterns in their account updates?\n4. What recommendations would you make for user engagement?\n\n## Output Format\n\nPlease structure your analysis as follows:\n\n1. **Executive Summary** - Key findings in 2-3 sentences\n2. **Detailed Insights** - Answer the analysis questions above\n3. **Trends and Patterns** - What patterns do you observe?\n4. **Recommendations** - Specific, actionable recommendations\n5. **Risk Assessment** - Any potential concerns or risks identified\n\nUse clear headings and bullet points for readability."
      }
    }
  ]
}
```

## Correções de Formato Implementadas

### Problema Inicial

Originalmente, tanto Resources quanto Prompts estavam retornando strings diretamente:

```typescript
// ❌ INCORRETO - Retornava string vazia no cliente
return JSON.stringify(data, null, 2);
return promptText;
```

### Solução Implementada

Ajustamos para retornar os formatos esperados pelo protocolo MCP:

#### Resources

```typescript
// ✅ CORRETO - Formato MCP Resource
return {
  contents: [
    {
      uri: 'config://api/endpoints',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2)
    }
  ]
};
```

#### Prompts

```typescript
// ✅ CORRETO - Formato MCP Prompt
return {
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: promptText
      }
    }
  ]
};
```
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
