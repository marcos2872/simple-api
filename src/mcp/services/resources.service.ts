import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Resource } from '@rekog/mcp-nest';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  @Resource({
    uri: 'config://api/endpoints',
    name: 'API Endpoints',
    description: 'List of available API endpoints',
    mimeType: 'application/json',
  })
  getApiEndpoints() {
    const endpoints = {
      auth: {
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Authenticate user and get JWT token',
          body: {
            email: 'string',
            password: 'string',
          },
        },
      },
      users: {
        list: {
          method: 'GET',
          path: '/api/users',
          description: 'List all users (ADMIN only)',
          requiresAuth: true,
          permission: 'List User',
        },
        create: {
          method: 'POST',
          path: '/api/users',
          description: 'Create a new user (ADMIN only)',
          requiresAuth: true,
          permission: 'Create User',
          body: {
            name: 'string',
            email: 'string',
            password: 'string',
            role: 'ADMIN | USER (optional)',
          },
        },
        read: {
          method: 'GET',
          path: '/api/users/read/:id',
          description: 'Get user by ID (own profile or ADMIN)',
          requiresAuth: true,
          permission: 'Read User',
        },
        update: {
          method: 'PATCH',
          path: '/api/users/:id',
          description: 'Update user (own profile or ADMIN)',
          requiresAuth: true,
          permission: 'Update User',
          body: {
            name: 'string (optional)',
            email: 'string (optional)',
            password: 'string (optional)',
            role: 'ADMIN | USER (optional)',
          },
        },
        delete: {
          method: 'DELETE',
          path: '/api/users/:id',
          description: 'Delete user (ADMIN only)',
          requiresAuth: true,
          permission: 'Delete User',
        },
      },
      mcp: {
        sse: {
          method: 'GET',
          path: '/sse',
          description: 'Establish SSE connection for MCP',
          requiresAuth: true,
          permission: 'Read MCP',
        },
        messages: {
          method: 'POST',
          path: '/messages',
          description: 'Send MCP messages and execute tools',
          requiresAuth: true,
          permission: 'Read MCP',
        },
      },
    };

    return {
      contents: [
        {
          uri: 'config://api/endpoints',
          mimeType: 'application/json',
          text: JSON.stringify(endpoints, null, 2),
        },
      ],
    };
  }

  @Resource({
    uri: 'config://casl/permissions',
    name: 'CASL Permissions Matrix',
    description: 'Permission matrix showing what each role can do',
    mimeType: 'application/json',
  })
  getPermissionsMatrix() {
    const permissions = {
      roles: {
        ADMIN: {
          User: ['manage'], // Can do everything with users
          MCP: ['manage'], // Can do everything with MCP
          description: 'Full administrative access',
        },
        USER: {
          User: {
            read: 'Only own profile ({ id: user.id })',
            update: 'Only own profile ({ id: user.id })',
            forbidden: ['list', 'create', 'delete'],
          },
          MCP: {
            read: 'Only own MCP context ({ userId: user.id })',
            update: 'Only own MCP context ({ userId: user.id })',
            forbidden: ['list', 'create', 'delete'],
          },
          description: 'Limited access to own resources only',
        },
      },
      toolPermissions: {
        listUsers: { action: 'List', resource: 'User', adminOnly: true },
        getUser: {
          action: 'Read',
          resource: 'User',
          conditional: 'Can only access own profile unless ADMIN',
        },
        getUserByEmail: {
          action: 'Read',
          resource: 'User',
          conditional: 'Can only access own profile unless ADMIN',
        },
        createUser: { action: 'Create', resource: 'User', adminOnly: true },
        updateUser: {
          action: 'Update',
          resource: 'User',
          conditional: 'Can only update own profile unless ADMIN',
        },
        deleteUser: { action: 'Delete', resource: 'User', adminOnly: true },
      },
      mcpFlow: {
        connection: 'JWT authentication → CASL permission check',
        toolExecution:
          'Tool name validation → Permission check → Conditional validation → Execution',
        conditionalChecks:
          'For tools requiring ID, validates if user can access that specific resource',
      },
    };

    return {
      contents: [
        {
          uri: 'config://casl/permissions',
          mimeType: 'application/json',
          text: JSON.stringify(permissions, null, 2),
        },
      ],
    };
  }

  @Resource({
    uri: 'docs://api/getting-started',
    name: 'API Getting Started Guide',
    description: 'Step-by-step guide to using the API',
    mimeType: 'text/markdown',
  })
  getGettingStartedGuide() {
    const guide = `# API Getting Started Guide

## Authentication

1. **Login to get JWT token:**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "admin@example.com", "password": "admin123"}'
   \`\`\`

2. **Use the token in subsequent requests:**
   \`\`\`bash
   curl -X GET http://localhost:3000/api/users \\
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   \`\`\`

## User Management

### Creating Users (ADMIN only)
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "USER"
  }'
\`\`\`

### Reading Your Profile
\`\`\`bash
curl -X GET http://localhost:3000/api/users/read/YOUR_USER_ID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Updating Your Profile
\`\`\`bash
curl -X PATCH http://localhost:3000/api/users/YOUR_USER_ID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Name"}'
\`\`\`

## MCP Tools

### Connecting to MCP via SSE
\`\`\`bash
curl -X GET http://localhost:3000/sse \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Accept: text/event-stream"
\`\`\`

### Executing MCP Tools
\`\`\`bash
curl -X POST http://localhost:3000/messages \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "tools/call",
    "params": {
      "name": "getUser",
      "arguments": {
        "id": "YOUR_USER_ID"
      }
    }
  }'
\`\`\`

## Available MCP Tools

- **listUsers**: List all users (ADMIN only)
- **getUser**: Get user by ID (own profile or ADMIN)
- **getUserByEmail**: Get user by email (own profile or ADMIN)
- **createUser**: Create new user (ADMIN only)
- **updateUser**: Update user (own profile or ADMIN)
- **deleteUser**: Delete user (ADMIN only)

## Permission System

The API uses role-based permissions:

- **ADMIN**: Full access to all resources
- **USER**: Access only to own profile and limited MCP operations

## Error Codes

- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: Insufficient permissions for the requested action
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error

## Testing

You can test the API using the included e2e tests:
\`\`\`bash
pnpm test:e2e
\`\`\`
`;

    return {
      contents: [
        {
          uri: 'docs://api/getting-started',
          mimeType: 'text/markdown',
          text: guide,
        },
      ],
    };
  }

  @Resource({
    uri: 'docs://mcp/protocol',
    name: 'MCP Protocol Documentation',
    description: 'Documentation on how the MCP protocol is implemented',
    mimeType: 'text/markdown',
  })
  getMcpProtocolDocs() {
    const docs = `# Model Context Protocol (MCP) Implementation

## Overview

This server implements the Model Context Protocol to provide AI assistants with secure access to user management capabilities.

## Architecture

### Transport Layer
- **SSE (Server-Sent Events)**: Real-time bidirectional communication
- **HTTP endpoint**: \`GET /sse\` for connection establishment
- **Message endpoint**: \`POST /messages\` for command execution

### Security Layer
- **JWT Authentication**: All MCP connections require valid JWT tokens
- **CASL Authorization**: Granular permission system based on user roles
- **Tool-level Permissions**: Each MCP tool is mapped to specific CASL actions

### MCP Components

#### 1. Tools
Tools are implemented using the \`@Tool\` decorator from \`@rekog/mcp-nest\`:

\`\`\`typescript
@Tool({
  name: 'getUser',
  description: 'Get a specific user by ID',
  parameters: z.object({
    id: z.string().describe('User ID'),
  }),
})
async findOne({ id }: { id: string }) {
  // Implementation
}
\`\`\`

#### 2. Resources (You are here!)
Resources provide static or dynamic data to AI assistants:

\`\`\`typescript
@Resource({
  uri: 'schema://prisma/user',
  name: 'User Schema',
  description: 'Prisma schema definition for User model',
  mimeType: 'text/plain',
})
async getUserSchema(): Promise<string> {
  // Implementation
}
\`\`\`

#### 3. Prompts
Prompts provide predefined templates for common tasks:

\`\`\`typescript
@Prompt({
  name: 'user-analysis',
  description: 'Analyze user patterns and behavior',
  arguments: z.object({
    userId: z.string().optional(),
    timeframe: z.string().default('30d'),
  }),
})
async analyzeUser({ userId, timeframe }: { userId?: string; timeframe: string }) {
  // Implementation
}
\`\`\`

## Permission Mapping

### Tool Permissions
Each MCP tool is mapped to CASL actions:

\`\`\`typescript
const TOOL_PERMISSIONS_MAP = {
  listUsers: { action: 'List', resource: 'User' },
  getUser: { action: 'Read', resource: 'User', requiresId: true },
  createUser: { action: 'Create', resource: 'User' },
  updateUser: { action: 'Update', resource: 'User', requiresId: true },
  deleteUser: { action: 'Delete', resource: 'User', requiresId: true },
};
\`\`\`

### Resource Permissions
Resources are protected by role-based access:
- **Public resources**: Available to all authenticated users
- **Admin resources**: Only available to ADMIN role
- **Conditional resources**: Based on user context

### Prompt Permissions
Prompts can be restricted based on:
- User role
- Resource ownership
- Custom conditions

## Message Flow

1. **Connection**: Client establishes SSE connection with JWT auth
2. **Authentication**: JWT token is validated and user is attached to request
3. **Message**: Client sends MCP message via POST /messages
4. **Authorization**: CASL checks if user can access MCP
5. **Tool Validation**: If tool execution, check tool-specific permissions
6. **Execution**: Tool/Resource/Prompt is executed
7. **Response**: Result is sent back via SSE

## Error Handling

- **401 Unauthorized**: Invalid JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Tool/Resource/Prompt not found
- **422 Validation Error**: Invalid parameters

## Usage Examples

### Executing a Tool
\`\`\`json
{
  "method": "tools/call",
  "params": {
    "name": "getUser",
    "arguments": {
      "id": "user_123"
    }
  }
}
\`\`\`

### Accessing a Resource
\`\`\`json
{
  "method": "resources/read",
  "params": {
    "uri": "schema://prisma/user"
  }
}
\`\`\`

### Using a Prompt
\`\`\`json
{
  "method": "prompts/get",
  "params": {
    "name": "user-analysis",
    "arguments": {
      "userId": "user_123",
      "timeframe": "7d"
    }
  }
}
\`\`\`

## Configuration

The MCP server is configured in \`McpSseModule\`:

\`\`\`typescript
McpModule.forRoot({
  name: 'simple-api',
  version: '1.0.0',
  transport: [], // SSE transport is handled by custom controller
})
\`\`\`

## Best Practices

1. **Always validate user permissions** before executing tools
2. **Use conditional permissions** for user-specific resources
3. **Implement proper error handling** for all MCP operations
4. **Log all MCP operations** for security auditing
5. **Use descriptive names and descriptions** for tools/resources/prompts
`;

    return {
      contents: [
        {
          uri: 'docs://mcp/protocol',
          mimeType: 'text/markdown',
          text: docs,
        },
      ],
    };
  }
}
