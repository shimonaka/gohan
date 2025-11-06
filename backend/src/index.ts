import { z } from 'zod';

export interface Env {
  DB: D1Database;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const PlanSchema = z.object({
  goalCategory: z.string().nullable().optional(),
  days: z.array(
    z.object({
      day: z.string(),
      mainId: z.string().nullable(),
      sideIds: z.array(z.string()),
    })
  ),
  generatedAt: z.string(),
  fridgeSnapshot: z.array(z.string()),
});

const ShoppingStateSchema = z.object({
  auto: z.array(z.string()),
  manual: z.array(z.string()),
  generatedAt: z.string().nullable(),
});

const GoalPayloadSchema = z.object({
  goal: z.string().nullable(),
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const userId = request.headers.get('X-Encrypted-Yw-ID');
    if (!userId) {
      return withCors(Response.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    const contentType = request.headers.get('Content-Type');
    if (isJsonRequest(request.method) && contentType && !contentType.includes('application/json')) {
      return withCors(Response.json({ error: 'Content-Type must be application/json' }, { status: 415 }));
    }

    try {
      switch (true) {
        case url.pathname === '/fridge' && request.method === 'GET':
          return withCors(await listFridgeItems(env, userId));
        case url.pathname === '/fridge' && request.method === 'PUT':
          return withCors(await replaceFridgeItems(request, env, userId));
        case url.pathname === '/plan' && request.method === 'GET':
          return withCors(await getPlan(env, userId));
        case url.pathname === '/plan' && request.method === 'PUT':
          return withCors(await upsertPlan(request, env, userId));
        case url.pathname === '/shopping' && request.method === 'GET':
          return withCors(await getShoppingState(env, userId));
        case url.pathname === '/shopping' && request.method === 'PUT':
          return withCors(await upsertShoppingState(request, env, userId));
        case url.pathname === '/goal' && request.method === 'GET':
          return withCors(await getGoal(env, userId));
        case url.pathname === '/goal' && request.method === 'PUT':
          return withCors(await upsertGoal(request, env, userId));
        default:
          return withCors(new Response('Not Found', { status: 404 }));
      }
    } catch (error) {
      console.error('Worker error', error);
      return withCors(Response.json({ error: 'Internal server error' }, { status: 500 }));
    }
  },
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

const isJsonRequest = (method: string) => ['POST', 'PUT', 'PATCH'].includes(method);

async function listFridgeItems(env: Env, userId: string): Promise<Response> {
  const stmt = env.DB.prepare('SELECT name FROM fridge_items WHERE user_id = ? ORDER BY name ASC');
  const { results } = await stmt.bind(userId).all<{ name: string }>();
  return Response.json({ items: results.map((row) => row.name) });
}

async function replaceFridgeItems(request: Request, env: Env, userId: string): Promise<Response> {
  const { items } = await request.json<{ items: string[] }>();
  if (!Array.isArray(items)) {
    return Response.json({ error: 'items must be an array of strings' }, { status: 400 });
  }
  const uniqueItems = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

  const deleteStmt = env.DB.prepare('DELETE FROM fridge_items WHERE user_id = ?');
  const insertStmt = env.DB.prepare(
    'INSERT INTO fridge_items (user_id, name, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))'
  );
  const batch = [deleteStmt.bind(userId)];
  uniqueItems.forEach((item) => {
    batch.push(insertStmt.bind(userId, item));
  });
  await env.DB.batch(batch);

  await ensureUserRecord(env, userId);
  return Response.json({ success: true, items: uniqueItems });
}

async function getPlan(env: Env, userId: string): Promise<Response> {
  const stmt = env.DB.prepare(
    'SELECT goal_category, plan_json, fridge_snapshot_json, generated_at FROM weekly_plans WHERE user_id = ?'
  );
  const row = await stmt.bind(userId).first<{
    goal_category: string | null;
    plan_json: string;
    fridge_snapshot_json: string;
    generated_at: string;
  }>();

  if (!row) {
    return Response.json({ plan: null });
  }

  return Response.json({
    plan: {
      goalCategory: row.goal_category,
      days: JSON.parse(row.plan_json),
      fridgeSnapshot: JSON.parse(row.fridge_snapshot_json),
      generatedAt: row.generated_at,
    },
  });
}

async function upsertPlan(request: Request, env: Env, userId: string): Promise<Response> {
  const payload = PlanSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json({ error: 'Invalid plan payload', issues: payload.error.flatten() }, { status: 400 });
  }

  const { data } = payload;
  const stmt = env.DB.prepare(`
    INSERT INTO weekly_plans (user_id, goal_category, plan_json, fridge_snapshot_json, generated_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime("now"))
    ON CONFLICT(user_id)
    DO UPDATE SET goal_category = excluded.goal_category,
                  plan_json = excluded.plan_json,
                  fridge_snapshot_json = excluded.fridge_snapshot_json,
                  generated_at = excluded.generated_at,
                  updated_at = datetime("now")
  `);

  await stmt
    .bind(userId, data.goalCategory ?? null, JSON.stringify(data.days), JSON.stringify(data.fridgeSnapshot), data.generatedAt)
    .run();

  await ensureUserRecord(env, userId);
  return Response.json({ success: true });
}

async function getShoppingState(env: Env, userId: string): Promise<Response> {
  const stmt = env.DB.prepare(
    'SELECT auto_items_json, manual_items_json, generated_at FROM shopping_lists WHERE user_id = ?'
  );
  const row = await stmt.bind(userId).first<{
    auto_items_json: string;
    manual_items_json: string;
    generated_at: string | null;
  }>();

  if (!row) {
    return Response.json({ state: { auto: [], manual: [], generatedAt: null } });
  }

  return Response.json({
    state: {
      auto: JSON.parse(row.auto_items_json),
      manual: JSON.parse(row.manual_items_json),
      generatedAt: row.generated_at,
    },
  });
}

async function upsertShoppingState(request: Request, env: Env, userId: string): Promise<Response> {
  const payload = ShoppingStateSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json({ error: 'Invalid shopping payload', issues: payload.error.flatten() }, { status: 400 });
  }

  const { data } = payload;
  const stmt = env.DB.prepare(`
    INSERT INTO shopping_lists (user_id, auto_items_json, manual_items_json, generated_at, updated_at)
    VALUES (?, ?, ?, ?, datetime("now"))
    ON CONFLICT(user_id)
    DO UPDATE SET auto_items_json = excluded.auto_items_json,
                  manual_items_json = excluded.manual_items_json,
                  generated_at = excluded.generated_at,
                  updated_at = datetime("now")
  `);

  await stmt
    .bind(
      userId,
      JSON.stringify(Array.from(new Set(data.auto))),
      JSON.stringify(Array.from(new Set(data.manual))),
      data.generatedAt
    )
    .run();

  await ensureUserRecord(env, userId);
  return Response.json({ success: true });
}

async function getGoal(env: Env, userId: string): Promise<Response> {
  const stmt = env.DB.prepare('SELECT goal_category FROM weekly_plans WHERE user_id = ?');
  const row = await stmt.bind(userId).first<{ goal_category: string | null }>();
  return Response.json({ goal: row?.goal_category ?? null });
}

async function upsertGoal(request: Request, env: Env, userId: string): Promise<Response> {
  const payload = GoalPayloadSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json({ error: 'Invalid goal payload', issues: payload.error.flatten() }, { status: 400 });
  }

  const goal = payload.data.goal;

  const stmt = env.DB.prepare(`
    INSERT INTO weekly_plans (user_id, goal_category, plan_json, fridge_snapshot_json, generated_at, updated_at)
    VALUES (?, ?, '[]', '[]', datetime("now"), datetime("now"))
    ON CONFLICT(user_id)
    DO UPDATE SET goal_category = excluded.goal_category,
                  plan_json = CASE WHEN plan_json = '[]' THEN excluded.plan_json ELSE plan_json END,
                  fridge_snapshot_json = CASE WHEN fridge_snapshot_json = '[]' THEN excluded.fridge_snapshot_json ELSE fridge_snapshot_json END,
                  generated_at = CASE WHEN plan_json = '[]' THEN excluded.generated_at ELSE generated_at END,
                  updated_at = datetime("now")
  `);

  await stmt.bind(userId, goal).run();
  await ensureUserRecord(env, userId);
  return Response.json({ success: true, goal });
}

async function ensureUserRecord(env: Env, userId: string): Promise<void> {
  const stmt = env.DB.prepare(`
    INSERT INTO users (encrypted_yw_id, created_at, last_seen_at)
    VALUES (?, datetime("now"), datetime("now"))
    ON CONFLICT(encrypted_yw_id)
    DO UPDATE SET last_seen_at = datetime("now")
  `);

  await stmt.bind(userId).run();
}
