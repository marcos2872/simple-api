<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Simple API - NestJS with MCP & CASL

API REST com autenticação JWT, autorização CASL e integração Model Context Protocol (MCP) para execução de tools via SSE.

## 📋 Funcionalidades

- ✅ **Autenticação JWT**: Sistema de login com tokens seguros
- ✅ **Autorização CASL**: Controle granular de permissões baseado em roles (ADMIN/USER)
- ✅ **MCP Integration**: Model Context Protocol com SSE para execução de tools
- ✅ **API REST**: CRUD completo de usuários com validação de permissões
- ✅ **Testes E2E**: Cobertura completa de testes de permissões
- ✅ **Prisma ORM**: Banco de dados PostgreSQL com migrations
- ✅ **Swagger/OpenAPI**: Documentação automática da API

## 🚀 Tecnologias

- **NestJS** - Framework Node.js progressivo
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados relacional
- **JWT** - JSON Web Tokens para autenticação
- **CASL** - Biblioteca de autorização isomórfica
- **@rekog/mcp-nest** - Model Context Protocol para NestJS
- **Passport** - Middleware de autenticação
- **Zod** - Validação de schemas TypeScript
- **Swagger** - Documentação OpenAPI
- **Jest** - Framework de testes

## 📦 Instalação

## 📦 Instalação

```bash
# Instalar dependências
$ pnpm install

# Configurar variáveis de ambiente
$ cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar migrations do banco de dados
$ pnpm prisma migrate dev

# (Opcional) Seed do banco com dados iniciais
$ pnpm prisma db seed
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/simple_api"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
```

## 🏃 Executar o Projeto

## 🏃 Executar o Projeto

```bash
# Modo desenvolvimento (watch)
$ pnpm run start:dev

# Modo desenvolvimento
$ pnpm run start

# Modo produção
$ pnpm run start:prod
```

O servidor estará disponível em: `http://localhost:3000/api`

Documentação Swagger: `http://localhost:3000/api/docs`

## 🧪 Testes

## 🧪 Testes

```bash
# Testes unitários
$ pnpm run test

# Testes E2E (requer banco de dados de teste)
$ pnpm test:e2e

# Cobertura de testes
$ pnpm run test:cov
```

### Testes E2E

Os testes validam todas as permissões CASL:

```bash
✓ ADMIN - Pode listar/criar/ler/atualizar/deletar usuários
✓ USER - NÃO pode listar todos os usuários (403)
✓ USER - Pode apenas ler/atualizar seu próprio perfil
✓ USER - NÃO pode acessar outros usuários (403)
✓ Autenticação - Rejeita requisições sem token (401)
```

Veja mais em: [test/README.md](./test/README.md)

## 📚 Documentação

### Sistema de Permissões CASL

Documentação completa do sistema de autorização: [src/casl/README.md](./src/casl/README.md)

#### Roles e Permissões

**ADMIN** - Acesso total:

- ✅ Todas as operações em Users (list, create, read, update, delete)
- ✅ Todos os MCP tools sem restrições

**USER** - Acesso limitado:

- ✅ Ler e atualizar apenas seu próprio perfil
- ✅ Executar MCP tools apenas com seu próprio ID
- ❌ Listar todos os usuários
- ❌ Criar ou deletar usuários
- ❌ Acessar dados de outros usuários

### API REST Endpoints

#### Autenticação

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "id": "uuid",
  "role": "USER"
}
```

#### Usuários

Todas as rotas requerem autenticação via `Authorization: Bearer <token>`

```http
# Listar todos (apenas ADMIN)
GET /api/users

# Ver próprio perfil ou qualquer perfil (ADMIN)
GET /api/users/read/:id

# Criar usuário (apenas ADMIN)
POST /api/users

# Atualizar próprio perfil ou qualquer perfil (ADMIN)
PATCH /api/users/:id

# Deletar usuário (apenas ADMIN)
DELETE /api/users/:id
```

### MCP (Model Context Protocol)

#### Conexão SSE

```http
GET /api/sse
Authorization: Bearer <token>
```

#### Tools Disponíveis

O sistema expõe os seguintes tools via MCP:

- `listUsers` - Listar todos os usuários (apenas ADMIN)
- `getUser` - Obter usuário por ID (próprio ID ou ADMIN)
- `getUserByEmail` - Obter usuário por email (próprio email ou ADMIN)
- `createUser` - Criar novo usuário (apenas ADMIN)
- `updateUser` - Atualizar usuário (próprio ID ou ADMIN)
- `deleteUser` - Deletar usuário (apenas ADMIN)

**Exemplo de chamada via MCP:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "getUser",
    "arguments": {
      "id": "user-uuid"
    }
  }
}
```

## 🏗️ Estrutura do Projeto

```
src/
├── auth/              # Autenticação JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── casl/              # Sistema de autorização
│   ├── ability.factory.ts      # Define permissões por role
│   ├── policies.guard.ts       # Guard de validação
│   ├── check-policies.decorator.ts
│   ├── action.enum.ts
│   └── README.md              # Documentação completa
├── mcp/               # Model Context Protocol
│   ├── controllers/
│   │   └── mcp.controlle.ts   # Validação de tools
│   └── mcp.module.ts
├── users/             # CRUD de usuários
│   ├── users.controller.ts    # REST endpoints
│   ├── users.service.ts       # Business logic + @Tool decorators
│   └── dto/
├── prisma/            # Prisma ORM
│   └── prisma.service.ts
└── main.ts

test/
├── users.e2e-spec.ts  # Testes de permissões
├── test-helper.ts     # Utilitários de teste
└── README.md

prisma/
├── schema.prisma      # Schema do banco
├── migrations/        # Migrations
└── seed.ts           # Dados iniciais
```

## 🔐 Segurança

- ✅ Autenticação via JWT com expiração configurável
- ✅ Senhas hasheadas com bcrypt
- ✅ Validação de permissões em todos os endpoints
- ✅ Validação de schemas com Zod e class-validator
- ✅ CORS configurável
- ✅ Guards de autenticação e autorização
- ✅ Validação de tools MCP antes da execução

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 📧 Contato

Para dúvidas ou suporte, abra uma issue no repositório.
