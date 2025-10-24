import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Injectable, Logger } from '@nestjs/common';
import { Action } from './action.enum';
import { AppAbility } from './policies.guard';
import { User } from '@prisma/client';

@Injectable()
export class AbilityFactory {
  private readonly logger = new Logger(AbilityFactory.name);

  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    this.logger.debug(
      `Creating abilities for user: ${user.email} (${user.role})`,
    );

    if (user?.role === 'ADMIN') {
      can(Action.Manage, 'User');
      can(Action.Manage, 'MCP');
      this.logger.debug('Admin: Full access granted');
    } else {
      // Regular users can only access their own user data
      can(Action.Read, 'User', { id: user.id });
      can(Action.Update, 'User', { id: user.id });

      // Explicitly forbid listing users
      cannot(Action.List, 'User');
      cannot(Action.Create, 'User');
      cannot(Action.Delete, 'User');

      // Regular users can access MCP only with their own userId
      can(Action.Read, 'MCP', { userId: user.id });
      can(Action.Update, 'MCP', { userId: user.id });

      this.logger.debug(`Regular user: Limited access for userId ${user.id}`);
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
        // Check if it's an MCP resource (has userId property)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ((subject as any).userId && !(subject as any).email) {
          return 'MCP';
        }
        // For plain objects, default to 'User'
        return 'User';
      },
    });

    // Test the ability
    const canList = ability.can(Action.List, 'User');
    this.logger.debug(`Can list users: ${canList}`);

    return ability;
  }
}
