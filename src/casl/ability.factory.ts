import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './action.enum';
import { AppAbility } from './policies.guard';
import { User } from '@prisma/client';

@Injectable()
export class AbilityFactory {
  createForUser(user: User) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user?.role === 'ADMIN') {
      can(Action.Manage, 'User');
    } else {
      can(Action.Read, 'User', { id: user.id });
      can(Action.Update, 'User', { id: user.id });
    }

    const ability = build({
      detectSubjectType: (subject) => {
        if (typeof subject === 'string') {
          return subject;
        }
        // Check if subject() helper was used (has __type property)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ((subject as any).__type) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
          return (subject as any).__type;
        }
        // For plain objects, default to 'User' since that's our only resource type
        return 'User';
      },
    });

    return ability;
  }
}
