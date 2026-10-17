import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import app from '../src/app.js';

let server;
let baseUrl;
let testTaskId;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
}

test('task API CRUD, validation, missing IDs, and CORS', async (t) => {
  await t.test('lists tasks and creates a valid task', async () => {
    const initial = await request('/api/tasks');
    assert.equal(initial.response.status, 200);
    assert.equal(initial.body.count, 0);

    const created = await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'API test task',
        description: 'Created by node:test',
        status: 'pending',
        priority: 'high',
        dueDate: '2028-02-29',
      }),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.body.data.dueDate, '2028-02-29');
    assert.ok(created.body.data.id);
    assert.ok(created.body.data.createdAt);
    assert.ok(created.body.data.updatedAt);
    testTaskId = created.body.data.id;
  });

  await t.test('gets and updates the task, including status-only update', async () => {
    const taskId = testTaskId;
    const fetched = await request(`/api/tasks/${taskId}`);
    assert.equal(fetched.response.status, 200);
    assert.equal(fetched.body.data.title, 'API test task');

    const updated = await request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated API test task',
        description: 'Updated by node:test',
        status: 'in_progress',
        priority: 'medium',
        dueDate: '2028-03-01',
      }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.status, 'in_progress');

    const statusOnly = await request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(statusOnly.response.status, 200);
    assert.equal(statusOnly.body.data.status, 'completed');
    assert.equal(statusOnly.body.data.title, 'Updated API test task');
  });

  await t.test('rejects invalid values and impossible calendar dates', async () => {
    const invalid = await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Invalid date task',
        description: 'Date must be rejected',
        status: 'pending',
        priority: 'low',
        dueDate: '2026-02-30',
      }),
    });
    assert.equal(invalid.response.status, 400);
    assert.ok(invalid.body.errors.some((error) => error.includes('dueDate')));
  });

  await t.test('returns 404 for missing IDs and deletes the task', async () => {
    const missingId = 'missing-task-id';
    const missingGet = await request(`/api/tasks/${missingId}`);
    assert.equal(missingGet.response.status, 404);

    const missingUpdate = await request(`/api/tasks/${missingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    });
    assert.equal(missingUpdate.response.status, 404);

    const deleted = await request(`/api/tasks/${testTaskId}`, { method: 'DELETE' });
    assert.equal(deleted.response.status, 200);

    const missingDelete = await request(`/api/tasks/${testTaskId}`, { method: 'DELETE' });
    assert.equal(missingDelete.response.status, 404);
    testTaskId = undefined;
  });

  await t.test('allows localhost development origins', async () => {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5175',
        'Access-Control-Request-Method': 'GET',
      },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5175');
  });
});