import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from './ability.factory';
import { Request } from 'express';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user;
    const ability = this.abilityFactory.createForUser(user);
    // attach ability to request for later decorators
    request.ability = ability;
    return true;
  }
}
