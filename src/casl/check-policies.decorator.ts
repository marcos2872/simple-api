import { SetMetadata } from '@nestjs/common';

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (handler: any) =>
  SetMetadata(CHECK_POLICIES_KEY, handler);
