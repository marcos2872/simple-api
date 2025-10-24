import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  createMongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './action.enum';
import { User } from '@prisma/client';
import { AppAbility } from './policies.guard';

type Subjects = InferSubjects<User | 'User'>;

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

    return build({
      detectSubjectType: (subject) =>
        subject.constructor.name as ExtractSubjectType<Subjects>,
    });
  }
}
