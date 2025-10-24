/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const match = await bcrypt.compare(pass, user.password);
    if (match) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }

  async loginTool(args: { email: string; password: string }) {
    const user = await this.validateUser(args.email, args.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.login(user);
  }

  login(user: Partial<User>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      email: user.email,
      id: user.id,
      role: user.role,
    };
  }
}
