const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Task API routes', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    test('should return all tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const response = await request(app)
        .get('/tasks');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('should filter tasks by status', async () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks?status=todo');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Todo task');
    });

    test('should return paginated tasks', async () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const response = await request(app)
        .get('/tasks?page=1&limit=2');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /tasks/stats', () => {
    test('should return task statistics', async () => {
      taskService.create({
        title: 'Todo',
        status: 'todo',
      });

      taskService.create({
        title: 'Done',
        status: 'done',
      });

      const response = await request(app)
        .get('/tasks/stats');

      expect(response.statusCode).toBe(200);
      expect(response.body.todo).toBe(1);
      expect(response.body.done).toBe(1);
      expect(response.body.in_progress).toBe(0);
      expect(response.body.overdue).toBe(0);
    });

    test('should return zero stats when there are no tasks', async () => {
      const response = await request(app)
        .get('/tasks/stats');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0,
      });
    });
  });

  describe('POST /tasks', () => {
    test('should create a new task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Learn Supertest',
          description: 'Write API tests',
          priority: 'high',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Learn Supertest');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('todo');
    });

    test('should reject a task without a title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          description: 'Missing title',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe(
        'title is required and must be a non-empty string'
      );
    });

    test('should reject an invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Invalid task',
          status: 'invalid',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('status must be one of');
    });
  });

  describe('PUT /tasks/:id', () => {
    test('should update an existing task', async () => {
      const task = taskService.create({
        title: 'Old title',
      });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          title: 'Updated title',
          priority: 'high',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(task.id);
      expect(response.body.title).toBe('Updated title');
      expect(response.body.priority).toBe('high');
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .put('/tasks/unknown-id')
        .send({
          title: 'Updated title',
        });

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    test('should delete an existing task', async () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      const response = await request(app)
        .delete(`/tasks/${task.id}`);

      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .delete('/tasks/unknown-id');

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    test('should complete an existing task', async () => {
      const task = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const response = await request(app)
        .patch(`/tasks/${task.id}/complete`);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(task.id);
      expect(response.body.status).toBe('done');
      expect(response.body.completedAt).not.toBeNull();
    });

    test('should return 404 for an unknown task', async () => {
      const response = await request(app)
        .patch('/tasks/unknown-id/complete');

      expect(response.statusCode).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });
  });
});
describe('PATCH /tasks/:id/assign', () => {
  test('should assign a task to a user', async () => {
    const created = taskService.create({
      title: 'Deploy API',
    });

    const response = await request(app)
      .patch(`/tasks/${created.id}/assign`)
      .send({
        assignee: 'Aman',
      });

    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Aman');
    expect(response.body.id).toBe(created.id);
  });

  test('should return 404 for an unknown task', async () => {
    const response = await request(app)
      .patch('/tasks/unknown-id/assign')
      .send({
        assignee: 'Aman',
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Task not found');
  });

  test('should return 400 when assignee is missing', async () => {
    const created = taskService.create({
      title: 'Deploy API',
    });

    const response = await request(app)
      .patch(`/tasks/${created.id}/assign`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('should return 400 when assignee is empty', async () => {
    const created = taskService.create({
      title: 'Deploy API',
    });

    const response = await request(app)
      .patch(`/tasks/${created.id}/assign`)
      .send({
        assignee: '',
      });

    expect(response.status).toBe(400);
  });

  test('should allow reassignment', async () => {
    const created = taskService.create({
      title: 'Deploy API',
    });

    await request(app)
      .patch(`/tasks/${created.id}/assign`)
      .send({
        assignee: 'Aman',
      });

    const response = await request(app)
      .patch(`/tasks/${created.id}/assign`)
      .send({
        assignee: 'Om',
      });

    expect(response.status).toBe(200);
    expect(response.body.assignee).toBe('Om');
  });
});