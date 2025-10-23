import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AbilityFactory } from './casl/ability.factory';

@Module({
  imports: [ConfigModule, UsersModule, AuthModule],
  controllers: [],
  providers: [AbilityFactory],
})
export class AppModule {}
