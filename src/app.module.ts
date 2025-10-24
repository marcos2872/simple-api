import { Global, Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CaslModule } from './casl/casl.module';
import { McpSseModule } from './mcp/mcp.module';

@Global()
@Module({
  imports: [ConfigModule, UsersModule, AuthModule, CaslModule, McpSseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
