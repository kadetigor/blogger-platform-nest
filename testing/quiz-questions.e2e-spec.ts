import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Quiz Questions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: any;

  const BASIC_AUTH = 'Basic YWRtaW46cXdlcnR5'; // admin:qwerty in base64

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

    dataSource = app.get(DataSource);
    httpServer = app.getHttpServer();
  });

  beforeEach(async () => {
    // Clear quiz_question table before each test
    await dataSource.query('DELETE FROM quiz_question');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /sa/questions', () => {
    it('should create a quiz question with valid data', async () => {
      const createDto = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris', 'paris']
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        body: createDto.body,
        correctAnswers: createDto.correctAnswers,
        published: false,
        createdAt: expect.any(String),
      });
    });

    it('should return 401 without authorization', async () => {
      const createDto = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris']
      };

      await request(httpServer)
        .post('/sa/questions')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 with invalid authorization', async () => {
      const createDto = {
        body: 'What is the capital of France?',
        correctAnswers: ['Paris']
      };

      await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', 'Basic invalid')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 if body is too short (less than 10 characters)', async () => {
      const createDto = {
        body: 'Short',
        correctAnswers: ['Paris']
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String)
          })
        ])
      );
    });

    it('should return 400 if body is too long (more than 500 characters)', async () => {
      const createDto = {
        body: 'a'.repeat(501),
        correctAnswers: ['Paris']
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String)
          })
        ])
      );
    });

    it('should return 400 if body is missing', async () => {
      const createDto = {
        correctAnswers: ['Paris']
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String)
          })
        ])
      );
    });

    it('should return 400 if correctAnswers is not an array', async () => {
      const createDto = {
        body: 'What is the capital of France?',
        correctAnswers: 'Paris'
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String)
          })
        ])
      );
    });

    it('should return 400 if correctAnswers is missing', async () => {
      const createDto = {
        body: 'What is the capital of France?'
      };

      const response = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'correctAnswers',
            message: expect.any(String)
          })
        ])
      );
    });
  });

  describe('GET /sa/questions', () => {
    beforeEach(async () => {
      // Create test questions
      const questions = [
        { body: 'What is the capital of France?', correctAnswers: ['Paris'] },
        { body: 'What is 2 + 2? Answer with a number', correctAnswers: ['4', 'four'] },
        { body: 'What color is the sky on a clear day?', correctAnswers: ['blue', 'Blue'] },
      ];

      for (const q of questions) {
        await request(httpServer)
          .post('/sa/questions')
          .set('Authorization', BASIC_AUTH)
          .send(q);
      }
    });

    it('should return all questions with default pagination', async () => {
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: 3,
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
            correctAnswers: expect.any(Array),
            published: expect.any(Boolean),
            createdAt: expect.any(String),
          })
        ])
      });

      expect(response.body.items).toHaveLength(3);
    });

    it('should return 401 without authorization', async () => {
      await request(httpServer)
        .get('/sa/questions')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should filter questions by body search term', async () => {
      const response = await request(httpServer)
        .get('/sa/questions')
        .query({ bodySerchTerm: 'France' })
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.OK);

      expect(response.body.totalCount).toBe(1);
      expect(response.body.items[0].body).toContain('France');
    });

    it('should paginate results correctly', async () => {
      const response = await request(httpServer)
        .get('/sa/questions')
        .query({ pageSize: 2, pageNumber: 1 })
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.OK);

      expect(response.body.pageSize).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.items).toHaveLength(2);
    });

    it('should sort questions by createdAt desc by default', async () => {
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.OK);

      const dates = response.body.items.map((q: any) => new Date(q.createdAt).getTime());

      // Check if dates are in descending order
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });
  });

  describe('PUT /sa/questions/:id', () => {
    let questionId: string;

    beforeEach(async () => {
      const createResponse = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'What is the capital of France?',
          correctAnswers: ['Paris']
        });

      questionId = createResponse.body.id;
    });

    it('should update a quiz question with valid data', async () => {
      const updateDto = {
        body: 'What is the capital city of France?',
        correctAnswers: ['Paris', 'paris', 'PARIS']
      };

      await request(httpServer)
        .put(`/sa/questions/${questionId}`)
        .set('Authorization', BASIC_AUTH)
        .send(updateDto)
        .expect(HttpStatus.NO_CONTENT);

      // Verify the update
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      const updatedQuestion = response.body.items.find((q: any) => q.id === questionId);
      expect(updatedQuestion.body).toBe(updateDto.body);
      expect(updatedQuestion.correctAnswers).toEqual(updateDto.correctAnswers);
    });

    it('should return 401 without authorization', async () => {
      await request(httpServer)
        .put(`/sa/questions/${questionId}`)
        .send({
          body: 'Updated question body?',
          correctAnswers: ['Answer']
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(httpServer)
        .put(`/sa/questions/${fakeId}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'Updated question body?',
          correctAnswers: ['Answer']
        })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 with invalid body length', async () => {
      const response = await request(httpServer)
        .put(`/sa/questions/${questionId}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'Short',
          correctAnswers: ['Answer']
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'body',
            message: expect.any(String)
          })
        ])
      );
    });
  });

  describe('PUT /sa/questions/:id/publish', () => {
    let questionId: string;

    beforeEach(async () => {
      const createResponse = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'What is the capital of France?',
          correctAnswers: ['Paris']
        });

      questionId = createResponse.body.id;
    });

    it('should publish a quiz question', async () => {
      await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      // Verify the question is published
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      const publishedQuestion = response.body.items.find((q: any) => q.id === questionId);
      expect(publishedQuestion.published).toBe(true);
    });

    it('should unpublish a quiz question', async () => {
      // First publish
      await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: true });

      // Then unpublish
      await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: false })
        .expect(HttpStatus.NO_CONTENT);

      // Verify the question is unpublished
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      const unpublishedQuestion = response.body.items.find((q: any) => q.id === questionId);
      expect(unpublishedQuestion.published).toBe(false);
    });

    it('should return 401 without authorization', async () => {
      await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .send({ published: true })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(httpServer)
        .put(`/sa/questions/${fakeId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: true })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 if published is missing', async () => {
      const response = await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'published',
            message: expect.any(String)
          })
        ])
      );
    });
  });

  describe('DELETE /sa/questions/:id', () => {
    let questionId: string;

    beforeEach(async () => {
      const createResponse = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'What is the capital of France?',
          correctAnswers: ['Paris']
        });

      questionId = createResponse.body.id;
    });

    it('should delete a quiz question', async () => {
      await request(httpServer)
        .delete(`/sa/questions/${questionId}`)
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.NO_CONTENT);

      // Verify the question is deleted
      const response = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      expect(response.body.totalCount).toBe(0);
    });

    it('should return 404 for non-existent question', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(httpServer)
        .delete(`/sa/questions/${fakeId}`)
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(httpServer)
        .delete('/sa/questions/invalid-id')
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // 1. Create a question
      const createResponse = await request(httpServer)
        .post('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'What is the capital of France?',
          correctAnswers: ['Paris']
        })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.id;
      expect(createResponse.body.published).toBe(false);

      // 2. Get all questions
      let getResponse = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.OK);

      expect(getResponse.body.totalCount).toBe(1);

      // 3. Update the question
      await request(httpServer)
        .put(`/sa/questions/${questionId}`)
        .set('Authorization', BASIC_AUTH)
        .send({
          body: 'What is the capital city of France?',
          correctAnswers: ['Paris', 'paris']
        })
        .expect(HttpStatus.NO_CONTENT);

      // 4. Publish the question
      await request(httpServer)
        .put(`/sa/questions/${questionId}/publish`)
        .set('Authorization', BASIC_AUTH)
        .send({ published: true })
        .expect(HttpStatus.NO_CONTENT);

      // 5. Verify updates
      getResponse = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      const updatedQuestion = getResponse.body.items[0];
      expect(updatedQuestion.body).toBe('What is the capital city of France?');
      expect(updatedQuestion.published).toBe(true);

      // 6. Delete the question
      await request(httpServer)
        .delete(`/sa/questions/${questionId}`)
        .set('Authorization', BASIC_AUTH)
        .expect(HttpStatus.NO_CONTENT);

      // 7. Verify deletion
      getResponse = await request(httpServer)
        .get('/sa/questions')
        .set('Authorization', BASIC_AUTH);

      expect(getResponse.body.totalCount).toBe(0);
    });

    it('should handle multiple questions with filtering and pagination', async () => {
      // Create multiple questions
      const questions = [
        { body: 'What is JavaScript primarily used for?', correctAnswers: ['Web development'] },
        { body: 'What does HTML stand for in web development?', correctAnswers: ['HyperText Markup Language'] },
        { body: 'What is Python known for in programming?', correctAnswers: ['Simplicity', 'Readability'] },
        { body: 'What is TypeScript based on and adds features to?', correctAnswers: ['JavaScript'] },
        { body: 'What framework is NestJS based on and inspired by?', correctAnswers: ['Angular', 'Express'] },
      ];

      for (const q of questions) {
        await request(httpServer)
          .post('/sa/questions')
          .set('Authorization', BASIC_AUTH)
          .send(q);
      }

      // Test filtering
      const filterResponse = await request(httpServer)
        .get('/sa/questions')
        .query({ bodySerchTerm: 'JavaScript' })
        .set('Authorization', BASIC_AUTH);

      expect(filterResponse.body.totalCount).toBeGreaterThanOrEqual(1); // At least JavaScript question, possibly TypeScript too
      const bodies = filterResponse.body.items.map((item: any) => item.body);
      expect(bodies.some((body: string) => body.includes('JavaScript'))).toBe(true);

      // Test pagination
      const page1Response = await request(httpServer)
        .get('/sa/questions')
        .query({ pageSize: 2, pageNumber: 1 })
        .set('Authorization', BASIC_AUTH);

      expect(page1Response.body.items).toHaveLength(2);
      expect(page1Response.body.pagesCount).toBe(3);

      const page2Response = await request(httpServer)
        .get('/sa/questions')
        .query({ pageSize: 2, pageNumber: 2 })
        .set('Authorization', BASIC_AUTH);

      expect(page2Response.body.items).toHaveLength(2);
    });
  });
});
