import { SetMetadata } from '@nestjs/common';
import { AppAbility } from './policies.guard';
import { User } from '@prisma/client';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (
  ability: AppAbility,
  params?: any,
  user?: User,
) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
