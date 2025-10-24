import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class TestHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async setupDatabase() {
    // Clean database
    await this.prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Admin Test',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    const user1 = await this.prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User One',
        password: hashedPassword,
        role: 'USER',
      },
    });

    const user2 = await this.prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User Two',
        password: hashedPassword,
        role: 'USER',
      },
    });

    return { admin, user1, user2 };
  }

  async cleanDatabase() {
    await this.prisma.user.deleteMany();
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
