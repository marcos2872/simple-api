import { Global, Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AbilityFactory } from './casl/ability.factory';
import { McpSseModule } from './mcp/mcp.module';

@Global()
@Module({
  imports: [ConfigModule, UsersModule, AuthModule, McpSseModule],
  controllers: [],
  providers: [AbilityFactory],
})
export class AppModule {}
