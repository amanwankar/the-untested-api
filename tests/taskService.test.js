const taskService = require('../src/services/taskService');

describe('taskService', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    test('should create a task with default values', () => {
      const task = taskService.create({
        title: 'Learn Jest',
      });

      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Learn Jest');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task).toHaveProperty('createdAt');
    });

    test('should create a task with provided values', () => {
      const task = taskService.create({
        title: 'Deploy API',
        description: 'Deploy using Docker',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-10-01',
      });

      expect(task.title).toBe('Deploy API');
      expect(task.description).toBe('Deploy using Docker');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe('2026-10-01');
    });
  });

  describe('getAll', () => {
    test('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });

      const tasks = taskService.getAll();

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
  });

  describe('findById', () => {
    test('should find a task by id', () => {
      const created = taskService.create({
        title: 'Find me',
      });

      const found = taskService.findById(created.id);

      expect(found).toEqual(created);
    });

    test('should return undefined for an unknown id', () => {
      const found = taskService.findById('unknown-id');

      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    test('should return tasks matching the status', () => {
      taskService.create({
        title: 'Todo task',
        status: 'todo',
      });

      taskService.create({
        title: 'Done task',
        status: 'done',
      });

      const tasks = taskService.getByStatus('todo');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Todo task');
    });
  });

  describe('getPaginated', () => {
    test('should return the first page of tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const tasks = taskService.getPaginated(1, 2);

      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });

    test('should return the second page of tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      taskService.create({ title: 'Task 3' });

      const tasks = taskService.getPaginated(2, 2);

      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 3');
    });
  });

  describe('getStats', () => {
    test('should count tasks by status', () => {
      taskService.create({
        title: 'Todo',
        status: 'todo',
      });

      taskService.create({
        title: 'Progress',
        status: 'in_progress',
      });

      taskService.create({
        title: 'Done',
        status: 'done',
      });

      const stats = taskService.getStats();

      expect(stats.todo).toBe(1);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(0);
    });

    test('should count overdue incomplete tasks', () => {
      taskService.create({
        title: 'Overdue task',
        status: 'todo',
        dueDate: '2020-01-01',
      });

      taskService.create({
        title: 'Completed old task',
        status: 'done',
        dueDate: '2020-01-01',
      });

      const stats = taskService.getStats();

      expect(stats.todo).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('update', () => {
    test('should update an existing task', () => {
      const task = taskService.create({
        title: 'Old title',
      });

      const updated = taskService.update(task.id, {
        title: 'New title',
        priority: 'high',
      });

      expect(updated.title).toBe('New title');
      expect(updated.priority).toBe('high');
      expect(updated.id).toBe(task.id);
    });

    test('should return null for an unknown task', () => {
      const updated = taskService.update('unknown-id', {
        title: 'New title',
      });

      expect(updated).toBeNull();
    });
  });

  describe('remove', () => {
    test('should remove an existing task', () => {
      const task = taskService.create({
        title: 'Delete me',
      });

      const result = taskService.remove(task.id);

      expect(result).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    test('should return false for an unknown task', () => {
      const result = taskService.remove('unknown-id');

      expect(result).toBe(false);
    });
  });

  describe('completeTask', () => {
    test('should mark a task as done', () => {
      const task = taskService.create({
        title: 'Complete me',
        priority: 'high',
      });

      const completed = taskService.completeTask(task.id);

      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
    });

    test('should return null for an unknown task', () => {
      const completed =
        taskService.completeTask('unknown-id');

      expect(completed).toBeNull();
    });
  });

  describe('assignTask', () => {
    test('should assign a task to a user', () => {
      const task = taskService.create({
        title: 'Deploy API',
      });

      const updated = taskService.assignTask(
        task.id,
        'Aman'
      );

      expect(updated).not.toBeNull();
      expect(updated.assignee).toBe('Aman');
      expect(updated.id).toBe(task.id);
    });

    test('should return null for an unknown task', () => {
      const updated = taskService.assignTask(
        'unknown-id',
        'Aman'
      );

      expect(updated).toBeNull();
    });

    test('should allow reassignment to another user', () => {
      const task = taskService.create({
        title: 'Deploy API',
      });

      taskService.assignTask(task.id, 'Aman');

      const updated = taskService.assignTask(
        task.id,
        'Om'
      );

      expect(updated.assignee).toBe('Om');
    });
  });
});