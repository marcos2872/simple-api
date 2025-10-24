/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * Exemplo de como implementar permissões granulares para tools MCP
 *
 * Este arquivo mostra como você pode estender o sistema de permissões
 * para controlar acesso a tools específicos do MCP baseado em roles
 */

import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Action } from './action.enum';
import { User } from '@prisma/client';

// Exemplo 1: Adicionar permissões específicas para tools MCP
export function createMcpAbilities(user: User) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

  if (user?.role === 'ADMIN') {
    // Admins podem executar todos os tools
    can(Action.Manage, 'MCP');
    can('execute', 'Tool'); // Pode executar qualquer tool
  } else {
    // Usuários regulares têm permissões limitadas
    can(Action.Read, 'MCP');

    // Permitir apenas tools específicos
    can('execute', 'Tool', { name: 'read_file' });
    can('execute', 'Tool', { name: 'list_dir' });
    can('execute', 'Tool', { name: 'grep_search' });

    // Bloquear tools perigosos
    cannot('execute', 'Tool', { name: 'run_terminal' });
    cannot('execute', 'Tool', { name: 'replace_string_in_file' });
    cannot('execute', 'Tool', { name: 'create_file' });
  }

  return build();
}

// Exemplo 2: Middleware para validar tools antes de executar
export function validateToolPermission(
  ability: any,
  toolName: string,
): boolean {
  // Verifica se o usuário tem permissão para executar este tool
  return ability.can('execute', 'Tool', { name: toolName });
}

// Exemplo 3: Lista de tools por role
export const TOOL_PERMISSIONS = {
  ADMIN: [
    'read_file',
    'create_file',
    'replace_string_in_file',
    'run_terminal',
    'grep_search',
    'semantic_search',
    'list_dir',
    'file_search',
    // ... todos os tools
  ],
  USER: [
    'read_file',
    'grep_search',
    'semantic_search',
    'list_dir',
    'file_search',
    // Apenas tools de leitura
  ],
} as const;

// Exemplo 4: Como usar no controlador MCP
/**
 * @Post('messages')
 * @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, 'MCP'))
 * async handleSse(
 *   @Req() req: Request & { user: User },
 *   @Res() res: Response,
 *   @Body() body: { method?: string; params?: any },
 * ): Promise<void> {
 *   // Se o método é tools/call, validar permissão do tool
 *   if (body.method === 'tools/call') {
 *     const toolName = body.params?.name;
 *     const ability = createMcpAbilities(req.user);
 *
 *     if (!validateToolPermission(ability, toolName)) {
 *       throw new ForbiddenException(
 *         `Você não tem permissão para executar o tool: ${toolName}`
 *       );
 *     }
 *   }
 *
 *   await this.mcpStreamableHttpService.handleMessage(req, res, body);
 * }
 */
