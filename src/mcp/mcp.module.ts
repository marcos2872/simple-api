import { forwardRef, Global, Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { CustomSseController } from './controllers/mcp.controlle';
import { AuthModule } from '../auth/auth.module';
import { CaslModule } from '../casl/casl.module';

@Global()
@Module({
  imports: [
    McpModule.forRoot({
      name: 'simple-api',
      version: '1.0.0',
      transport: [],
    }),
    forwardRef(() => AuthModule),
    CaslModule,
  ],
  controllers: [CustomSseController],
})
export class McpSseModule {}
