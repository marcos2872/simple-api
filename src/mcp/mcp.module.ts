import { Global, Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { CustomSseController } from './controllers/mcp.controlle';

@Global()
@Module({
  imports: [
    McpModule.forRoot({
      name: 'simple-api',
      version: '1.0.0',
      transport: [],
    }),
  ],
  controllers: [CustomSseController],
})
export class McpSseModule {}
