import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @CheckPolicies(({ ability }) => ability.can(Action.Create, 'User'))
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @CheckPolicies(({ ability }) => ability.can(Action.Read, 'User'))
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @CheckPolicies(({ ability }) => ability.can(Action.Read, 'User'))
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies(({ ability }) => ability.can(Action.Update, 'User'))
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicies(({ ability }) => ability.can(Action.Delete, 'User'))
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
