declare namespace Express {
  export interface Request {
    user: import('@prisma/client').User;
    ability: import('../casl/ability.factory').AppAbility;
  }
}
