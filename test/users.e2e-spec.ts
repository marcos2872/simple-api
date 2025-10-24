import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TestHelper } from './test-helper';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let testHelper: TestHelper;
  let adminToken: string;
  let user1Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    testHelper = new TestHelper();
    const users = await testHelper.setupDatabase();
    user1Id = users.user1.id;
    user2Id = users.user2.id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    // Login as admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    const adminLoginBody = adminLoginResponse.body as { access_token: string };
    adminToken = adminLoginBody.access_token;

    // Login as user1
    const user1LoginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user1@test.com', password: 'password123' });
    const user1LoginBody = user1LoginResponse.body as { access_token: string };
    user1Token = user1LoginBody.access_token;
  });

  afterAll(async () => {
    await testHelper.cleanDatabase();
    await testHelper.disconnect();
    await app.close();
  });

  describe('ADMIN permissions', () => {
    it('should list all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const list = response.body as Array<{ id: string }>;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(3);
    });

    it('should view any user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/read/${user1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const body = response.body as { id: string; email: string };
      expect(body.id).toBe(user1Id);
      expect(body.email).toBe('user1@test.com');
    });

    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          password: 'password123',
          role: 'USER',
        })
        .expect(201);
      const created = response.body as { id: string; email: string } & Record<
        string,
        unknown
      >;
      expect(created.email).toBe('newuser@test.com');
      expect(Object.prototype.hasOwnProperty.call(created, 'password')).toBe(
        false,
      );
    });

    it('should update any user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'User Two Updated' })
        .expect(200);
      const updated = response.body as { name: string };
      expect(updated.name).toBe('User Two Updated');
    });

    it('should delete any user', async () => {
      // Create a user to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'todelete@test.com',
          name: 'To Delete',
          password: 'password123',
          role: 'USER',
        });
      const createdToDelete = createResponse.body as { id: string };
      const userToDeleteId = createdToDelete.id;

      await request(app.getHttpServer())
        .delete(`/api/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('USER permissions', () => {
    it('should NOT list all users', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('should view own user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/users/read/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      const me = response.body as { id: string; email: string };
      expect(me.id).toBe(user1Id);
      expect(me.email).toBe('user1@test.com');
    });

    it('should NOT view other users', async () => {
      await request(app.getHttpServer())
        .get(`/api/users/read/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('should update own profile', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'User One Updated' })
        .expect(200);
      const updatedSelf = response.body as { name: string };
      expect(updatedSelf.name).toBe('User One Updated');
    });

    it('should NOT update other users', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Trying to hack' })
        .expect(403);
    });

    it('should NOT create users', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'hacker@test.com',
          name: 'Hacker',
          password: 'password123',
          role: 'ADMIN',
        })
        .expect(403);
    });

    it('should NOT delete any user (including self)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('should reject invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
