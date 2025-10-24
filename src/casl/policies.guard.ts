import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PolicyHandler } from './check-policies.decorator';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { Request } from 'express';
import { User } from '@prisma/client';
import { MongoAbility, MongoQuery } from '@casl/ability';
import { Action } from './action.enum';

export type PermissionResource = Partial<User> | 'User';

export type AppAbility = MongoAbility<[Action, PermissionResource], MongoQuery>;
@Injectable()
export class PoliciesGuard implements CanActivate {
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
    const ability = this.abilityFactory.createForUser(user);
    // attach ability to request for later decorators
    request.ability = ability;

    const params: Record<string, any> = request.params || {};

    const canActivate = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability, params),
    );

    if (!canActivate) {
      throw new ForbiddenException();
    }

    return true;
  }

  private execPolicyHandler(
    handler: PolicyHandler,
    ability: AppAbility,
    params: any,
  ) {
    if (typeof handler === 'function') {
      return handler(ability, params);
    }
    return handler.handle(ability);
  }
}
