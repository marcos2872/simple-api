/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './action.enum';
import { User } from '@prisma/client';

type Subjects = InferSubjects<'User'>;
export type AppAbility = PureAbility<[Action, Subjects]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      PureAbility as AbilityClass<AppAbility>,
    );

    if (user?.role === 'ADMIN') {
      can(Action.Manage, 'User');
    } else {
      can(Action.Read, 'User', { id: user.id });
      can(Action.Update, 'User', { id: user.id });
    }

    return build({
      detectSubjectType: (item) => 'User' as ExtractSubjectType<Subjects>,
    });
  }
}
