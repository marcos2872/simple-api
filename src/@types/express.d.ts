declare namespace Express {
  export interface Request {
    user: import('@prisma/client').User;
    ability: import('../casl/policies.guard').AppAbility;
    params: Record<string, any>;
  }
}
