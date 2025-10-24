# Teste de Permissões CASL

## ✅ Correções Aplicadas

1. **Adicionado `cannot()` explícito** para usuários regulares:
   - `cannot(Action.List, 'User')` - Não pode listar usuários
   - `cannot(Action.Create, 'User')` - Não pode criar usuários
   - `cannot(Action.Delete, 'User')` - Não pode deletar usuários

2. **Corrigido `UsersModule`** para importar `CaslModule`:
   - Antes: Provinha `AbilityFactory` localmente (instância duplicada)
   - Agora: Importa `CaslModule` (instância única e compartilhada)

---

## 🧪 Como Testar

### 1. Login como Usuário Regular (USER)

```bash
# Fazer login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "senha123"}'

# Copiar o access_token da resposta
TOKEN="cole_aqui_o_token"
```

### 2. Testar Permissões

#### ❌ Deve FALHAR - Listar Todos os Usuários

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 403 Forbidden
```

#### ❌ Deve FALHAR - Criar Usuário

```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "novo@example.com", "password": "senha", "name": "Novo"}'

# Esperado: 403 Forbidden
```

#### ✅ Deve FUNCIONAR - Ler Próprio Perfil

```bash
# Substitua SEU_USER_ID pelo ID do usuário logado
curl -X GET http://localhost:3000/users/read/SEU_USER_ID \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 200 OK com dados do usuário
```

#### ✅ Deve FUNCIONAR - Atualizar Próprio Perfil

```bash
# Substitua SEU_USER_ID pelo ID do usuário logado
curl -X PATCH http://localhost:3000/users/SEU_USER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Nome Atualizado"}'

# Esperado: 200 OK com dados atualizados
```

#### ❌ Deve FALHAR - Ler Perfil de Outro Usuário

```bash
# Use o ID de outro usuário
curl -X GET http://localhost:3000/users/read/OUTRO_USER_ID \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 403 Forbidden
```

#### ❌ Deve FALHAR - Deletar Usuário

```bash
curl -X DELETE http://localhost:3000/users/SEU_USER_ID \
  -H "Authorization: Bearer $TOKEN"

# Esperado: 403 Forbidden
```

### 3. Login como Admin (ADMIN)

```bash
# Fazer login como admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "senha_admin"}'

ADMIN_TOKEN="cole_aqui_o_token_admin"
```

#### ✅ Deve FUNCIONAR - Listar Todos os Usuários

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Esperado: 200 OK com lista de todos os usuários
```

#### ✅ Deve FUNCIONAR - Todas as Operações

```bash
# Admin pode fazer tudo
```

---

## 📋 Resumo das Permissões

### Usuário Regular (USER)

- ✅ `GET /users/read/:id` - Apenas seu próprio ID
- ✅ `PATCH /users/:id` - Apenas seu próprio ID
- ❌ `GET /users` - Listar todos (negado)
- ❌ `POST /users` - Criar usuário (negado)
- ❌ `DELETE /users/:id` - Deletar usuário (negado)
- ❌ Acessar dados de outros usuários (negado)

### Administrador (ADMIN)

- ✅ Todas as operações
- ✅ Acesso a todos os recursos

### MCP (ambos os roles)

- **USER**: Apenas conexões com seu próprio `userId`
- **ADMIN**: Acesso total ao MCP
