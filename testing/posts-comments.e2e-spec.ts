import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UsersService } from '../src/modules/user-accounts/application/users.service';
import { JwtService } from '@nestjs/jwt';

describe('Posts Comments (e2e)', () => {
  let app: INestApplication;
  let mongoConnection: Connection;
  let httpServer: any;
  
  // Test data
  let accessToken: string;
  let userId: string;
  let blogId: string;
  let postId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes you use in main.ts
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: false,
      errorHttpStatusCode: 400,
      exceptionFactory: (errors) => {
        const errorsMessages = errors.map(error => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', ')
        }));
        
        return new BadRequestException({ errorsMessages });
      }
    }));
    
    await app.init();
    
    mongoConnection = moduleFixture.get<Connection>(getConnectionToken());
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    // Create test user
    const userDto = {
      login: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    // First, we need to create a user through the service directly
    // since registration requires email confirmation
    const usersService = app.get(UsersService);
    await usersService.createUser(userDto);

    // Now login
    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        loginOrEmail: userDto.login,
        password: userDto.password
      })
      .expect(HttpStatus.OK);

    accessToken = loginResponse.body.accessToken;

    // Decode the JWT to get user info
    const jwtService = app.get(JwtService);
    const decoded = jwtService.decode(accessToken) as any;
    userId = decoded.id || decoded.userId;  // Handle both field names

    // Create test blog
    const blogResponse = await request(httpServer)
      .post('/blogs')
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5') // admin:qwerty in base64
      .send({
        name: 'Test Blog',
        description: 'Test Description',
        websiteUrl: 'https://test.com'
      })
      .expect(HttpStatus.CREATED);

    blogId = blogResponse.body.id;

    // Create test post
    const postResponse = await request(httpServer)
      .post('/posts')
      .set('Authorization', 'Basic YWRtaW46cXdlcnR5')
      .send({
        title: 'Test Post',
        shortDescription: 'Test Short Description',
        content: 'Test Content',
        blogId: blogId
      })
      .expect(HttpStatus.CREATED);

    postId = postResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts/:postId/comments', () => {
    it('should create comment for existing post', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      const response = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.CREATED);

      // Verify response structure
      expect(response.body).toMatchObject({
        id: expect.any(String),
        content: commentDto.content,
        commentatorInfo: {
          userId: userId,
          userLogin: 'testuser'
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None'
        }
      });
    });

    it('should return 401 when not authenticated', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .send(commentDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid token', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', 'Bearer invalid_token')
        .send(commentDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when post does not exist', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      const nonExistentPostId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId

      await request(httpServer)
        .post(`/posts/${nonExistentPostId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 when content is too short', async () => {
      const commentDto = {
        content: 'Too short'
      };

      const response = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('20 characters')
        ])
      });
    });

    it('should return 400 when content is too long', async () => {
      const commentDto = {
        content: 'a'.repeat(301) // 301 characters
      };

      const response = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('300 characters')
        ])
      });
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.any(String)
        ])
      });
    });

    it('should return 400 when content is not a string', async () => {
      const response = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 123 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('must be a string')
        ])
      });
    });

    it('should create multiple comments for the same post', async () => {
      const comment1 = {
        content: 'First comment with at least 20 characters'
      };
      const comment2 = {
        content: 'Second comment with at least 20 characters'
      };

      const response1 = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment1)
        .expect(HttpStatus.CREATED);

      const response2 = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(comment2)
        .expect(HttpStatus.CREATED);

      expect(response1.body.content).toBe(comment1.content);
      expect(response2.body.content).toBe(comment2.content);
      expect(response1.body.id).not.toBe(response2.body.id);
    });

    it('should handle invalid postId format', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      await request(httpServer)
        .post('/posts/invalid-id/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.NOT_FOUND); // Mongoose will fail to find with invalid ObjectId
    });
  });

  describe('Integration with other endpoints', () => {
    it('created comment should be retrievable via GET /comments/:id', async () => {
      const commentDto = {
        content: 'This is a test comment with at least 20 characters'
      };

      const createResponse = await request(httpServer)
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentDto)
        .expect(HttpStatus.CREATED);

      const commentId = createResponse.body.id;

      const getResponse = await request(httpServer)
        .get(`/comments/${commentId}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body).toMatchObject({
        id: commentId,
        content: commentDto.content,
        commentatorInfo: {
          userId: userId,
          userLogin: 'testuser'
        },
        createdAt: expect.any(String),
        likesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None'
        }
      });
    });
  });
});