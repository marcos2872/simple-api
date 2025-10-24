import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PolicyHandler } from './check-policies.decorator';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { Request } from 'express';
import { User } from '@prisma/client';
import { MongoAbility, MongoQuery } from '@casl/ability';
import { Action } from './action.enum';

export type PermissionResource =
  | Partial<User>
  | 'User'
  | 'MCP'
  | { userId: string };

export type AppAbility = MongoAbility<[Action, PermissionResource], MongoQuery>;
@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext) {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        'check_policies',
        context.getHandler(),
      ) || [];

    const request: Request & { user: User; params: Record<string, any> } =
      context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`User: ${user.email} (${user.role})`);
    this.logger.debug(`Policy handlers count: ${policyHandlers.length}`);

    const ability = this.abilityFactory.createForUser(user);
    // attach ability to request for later decorators
    request.ability = ability;

    const params: Record<string, any> = request.params || {};

    const canActivate = policyHandlers.every((handler) => {
      const result = this.execPolicyHandler(handler, ability, params, user);
      this.logger.debug(`Policy check result: ${result}`);
      return result;
    });

    if (!canActivate) {
      this.logger.warn(`Access denied for ${user.email}`);
      throw new ForbiddenException();
    }

    this.logger.debug(`Access granted for ${user.email}`);
    return true;
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: AppAbility,
    params: any,
    user: User,
  ) {
    if (typeof handler === 'function') {
      return handler(ability, params, user);
    }
    return handler.handle(ability);
  }
}
