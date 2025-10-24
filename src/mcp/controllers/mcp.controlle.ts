import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { McpSseService } from '@rekog/mcp-nest';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PoliciesGuard } from 'src/casl/policies.guard';

@Controller()
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class CustomSseController {
  private readonly logger = new Logger(CustomSseController.name);

  constructor(private readonly mcpStreamableHttpService: McpSseService) {}

  @Get('sse')
  async connectionSse(@Req() req: any, @Res() res: any): Promise<void> {
    await this.mcpStreamableHttpService.createSseConnection(
      req,
      res,
      'messages',
      '',
    );
  }

  @Post('messages')
  async handleSse(
    @Req() req: any,
    @Res() res: any,
    @Body() body: any,
  ): Promise<void> {
    await this.mcpStreamableHttpService.handleMessage(req, res, {
      ...body,
      // params: { ...body.params, user: req.user },
    });
  }
}
