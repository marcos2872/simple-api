import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Logger,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { McpSseService } from '@rekog/mcp-nest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PoliciesGuard } from '../../casl/policies.guard';
import { CheckPolicies } from '../../casl/check-policies.decorator';
import { Action } from '../../casl/action.enum';
import { AppAbility } from '../../casl/policies.guard';
import type { Request, Response } from 'express';
import { User } from '@prisma/client';
import { subject } from '@casl/ability';
import { AbilityFactory } from '../../casl/ability.factory';

// Mapeamento de tools MCP para ações CASL
const TOOL_PERMISSIONS_MAP: Record<
  string,
  { action: Action; resource: string; requiresId?: boolean }
> = {
  listUsers: { action: Action.List, resource: 'User' },
  getUser: { action: Action.Read, resource: 'User', requiresId: true },
  getUserByEmail: { action: Action.Read, resource: 'User', requiresId: true },
  createUser: { action: Action.Create, resource: 'User' },
  updateUser: { action: Action.Update, resource: 'User', requiresId: true },
  deleteUser: { action: Action.Delete, resource: 'User', requiresId: true },
};

// Mapeamento de recursos MCP para permissões CASL
const RESOURCE_PERMISSIONS_MAP: Record<
  string,
  { action: Action; adminOnly?: boolean }
> = {
  'schema://prisma/user': { action: Action.Access },
  'schema://prisma/full': { action: Action.Access, adminOnly: true },
  'config://api/endpoints': { action: Action.Access },
  'config://casl/permissions': { action: Action.Access, adminOnly: true },
  'stats://users/summary': { action: Action.Access, adminOnly: true },
  'docs://api/getting-started': { action: Action.Access },
  'docs://mcp/protocol': { action: Action.Access },
};

// Mapeamento de prompts MCP para permissões CASL
const PROMPT_PERMISSIONS_MAP: Record<
  string,
  { action: Action; adminOnly?: boolean }
> = {
  'user-analysis': { action: Action.Execute },
  'user-report': { action: Action.Execute },
  'security-audit': { action: Action.Execute, adminOnly: true },
};

@Controller()
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class CustomSseController {
  private readonly logger = new Logger(CustomSseController.name);

  constructor(
    private readonly mcpStreamableHttpService: McpSseService,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  @Get('sse')
  async connectionSse(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`SSE connection established for user: ${req.user.email}`);
    await this.mcpStreamableHttpService.createSseConnection(
      req,
      res,
      'messages',
      '',
    );
  }

  @Post('messages')
  @CheckPolicies((ability: AppAbility, _params: any, user: User) => {
    const mcpSubject = subject('MCP', { userId: user.id });
    return ability.can(Action.Read, mcpSubject);
  })
  async handleSse(
    @Req() req: Request & { user: User },
    @Res() res: Response,
    @Body()
    body: {
      method?: string;
      params?: {
        name?: string;
        uri?: string;
        arguments?: Record<string, any>;
      };
    },
  ): Promise<void> {
    this.logger.log(
      `MCP message received from user: ${req.user.email}, method: ${body.method || 'unknown'}`,
    );

    // Validar permissões para tools/call
    if (body.method === 'tools/call' && body.params?.name) {
      const toolName = body.params.name;
      const toolPermission = TOOL_PERMISSIONS_MAP[toolName];

      if (toolPermission) {
        const ability = this.abilityFactory.createForUser(req.user);
        const { action, resource, requiresId } = toolPermission;

        let hasPermission = false;

        if (requiresId && body.params.arguments?.id) {
          // Validar permissão com ID específico (ex: apenas seu próprio usuário)
          const resourceSubject = subject(resource, {
            id: body.params.arguments.id as string,
          });
          hasPermission = ability.can(action, resourceSubject);
        } else {
          // Validar permissão sem condições (ex: listar todos)
          hasPermission = ability.can(action, resource as 'User' | 'MCP');
        }

        this.logger.debug(
          `Tool: ${toolName}, Action: ${action}, Resource: ${resource}, Has Permission: ${hasPermission}`,
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Você não tem permissão para executar o tool: ${toolName}`,
          );
        }
      }
    }

    // Validar permissões para resources/read
    if (body.method === 'resources/read' && body.params?.uri) {
      const resourceUri = body.params.uri;
      const resourcePermission = RESOURCE_PERMISSIONS_MAP[resourceUri];

      if (resourcePermission) {
        const ability = this.abilityFactory.createForUser(req.user);
        const { action, adminOnly } = resourcePermission;

        const resourceSubject = subject('Resource', {
          adminOnly: adminOnly || false,
          public: !adminOnly,
        });

        const hasPermission = ability.can(action, resourceSubject);

        this.logger.debug(
          `Resource: ${resourceUri}, Action: ${action}, Admin Only: ${adminOnly}, Has Permission: ${hasPermission}`,
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Você não tem permissão para acessar o recurso: ${resourceUri}`,
          );
        }
      }
    }

    // Validar permissões para prompts/get
    if (body.method === 'prompts/get' && body.params?.name) {
      const promptName = body.params.name;
      const promptPermission = PROMPT_PERMISSIONS_MAP[promptName];

      if (promptPermission) {
        const ability = this.abilityFactory.createForUser(req.user);
        const { action, adminOnly } = promptPermission;

        const promptSubject = subject('Prompt', {
          adminOnly: adminOnly || false,
          public: !adminOnly,
        });

        const hasPermission = ability.can(action, promptSubject);

        this.logger.debug(
          `Prompt: ${promptName}, Action: ${action}, Admin Only: ${adminOnly}, Has Permission: ${hasPermission}`,
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Você não tem permissão para executar o prompt: ${promptName}`,
          );
        }
      }
    }

    await this.mcpStreamableHttpService.handleMessage(req, res, {
      ...body,
    });
  }
}
