import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATABASE_URL = process.env.DATABASE_URL;

// ─── PostgreSQL implementation ────────────────────────────────────────────

let pool = null;

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

const TABLE_MAP = {
  banks: 'banks',
  accounts: 'accounts',
  transactions: 'transactions',
  archived_transactions: 'archived_transactions',
  users: 'users',
};

async function pgQuery(text, params) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

function pgRowToObject(row) {
  if (!row) return null;
  const obj = { ...row };
  if (obj.created_at) obj.created_at = obj.created_at instanceof Date ? obj.created_at.toISOString() : obj.created_at;
  if (obj.updated_at) obj.updated_at = obj.updated_at instanceof Date ? obj.updated_at.toISOString() : obj.updated_at;
  if (obj.balance != null) obj.balance = Number(obj.balance);
  if (obj.amount != null) obj.amount = Number(obj.amount);
  if (obj.fee != null) obj.fee = Number(obj.fee);
  return obj;
}

export async function findAll(table) {
  const tbl = TABLE_MAP[table];
  if (DATABASE_URL) {
    const result = await pgQuery(`SELECT * FROM ${tbl} ORDER BY id`);
    return result.rows.map(pgRowToObject);
  }
  return jsonFindAll(table);
}

export async function findById(table, id) {
  const tbl = TABLE_MAP[table];
  if (DATABASE_URL) {
    const result = await pgQuery(`SELECT * FROM ${tbl} WHERE id = $1`, [Number(id)]);
    return pgRowToObject(result.rows[0] || null);
  }
  return jsonFindById(table, id);
}

export async function findBy(table, field, value) {
  const tbl = TABLE_MAP[table];
  if (DATABASE_URL) {
    const col = field === 'user_id' ? 'user_id' : field === 'bank_id' ? 'bank_id' : field;
    const result = await pgQuery(`SELECT * FROM ${tbl} WHERE ${col} = $1 ORDER BY id`, [value]);
    return result.rows.map(pgRowToObject);
  }
  return jsonFindBy(table, field, value);
}

export async function insert(table, data) {
  const tbl = TABLE_MAP[table];
  const now = new Date().toISOString();
  const record = { ...data, created_at: now, updated_at: now };

  if (DATABASE_URL) {
    const cols = Object.keys(record);
    const vals = Object.values(record);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pgQuery(
      `INSERT INTO ${tbl} (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    return pgRowToObject(result.rows[0]);
  }

  return jsonInsert(table, record);
}

export async function update(table, id, data) {
  const tbl = TABLE_MAP[table];
  const now = new Date().toISOString();
  const record = { ...data, updated_at: now };

  if (DATABASE_URL) {
    const cols = Object.keys(record);
    const vals = Object.values(record);
    const setClause = cols.map((col, i) => `${col} = $${i + 1}`).join(', ');
    vals.push(Number(id));
    const result = await pgQuery(
      `UPDATE ${tbl} SET ${setClause} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    return pgRowToObject(result.rows[0] || null);
  }

  return jsonUpdate(table, id, record);
}

export async function remove(table, id) {
  const tbl = TABLE_MAP[table];
  if (DATABASE_URL) {
    const result = await pgQuery(`DELETE FROM ${tbl} WHERE id = $1`, [Number(id)]);
    return result.rowCount > 0;
  }
  return jsonRemove(table, id);
}

export async function getNextId(table) {
  if (DATABASE_URL) {
    const tbl = TABLE_MAP[table];
    const result = await pgQuery(`SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${tbl}`);
    return Number(result.rows[0].next_id);
  }
  return jsonGetNextId(table);
}

export async function getTableConfig(table) {
  if (DATABASE_URL) {
    const rows = await findAll(table);
    return { data: rows };
  }
  return jsonGetTableConfig(table);
}

export async function reset() {
  if (DATABASE_URL) {
    const tables = Object.values(TABLE_MAP);
    for (const tbl of tables) {
      await pgQuery(`DELETE FROM ${tbl}`);
    }
    return;
  }
  jsonReset();
}

// ─── JSON fallback (development) ──────────────────────────────────────────

const tables = {
  banks: { file: path.join(DATA_DIR, 'banks.json'), data: null },
  accounts: { file: path.join(DATA_DIR, 'accounts.json'), data: null },
  transactions: { file: path.join(DATA_DIR, 'transactions.json'), data: null },
  archived_transactions: { file: path.join(DATA_DIR, 'archived_transactions.json'), data: null },
  users: { file: path.join(DATA_DIR, 'users.json'), data: null },
};

const nextIds = { banks: 1, accounts: 1, transactions: 1, users: 2, archived_transactions: 1 };
let loaded = false;

function jsonLoad() {
  if (loaded) return;
  for (const [name, config] of Object.entries(tables)) {
    try {
      const raw = fs.readFileSync(config.file, 'utf-8');
      config.data = JSON.parse(raw);
    } catch {
      config.data = [];
    }
    if (config.data.length > 0) {
      nextIds[name] = Math.max(...config.data.map((r) => r.id)) + 1;
    }
  }
  loaded = true;
}

function jsonSave(table) {
  const config = tables[table];
  fs.writeFileSync(config.file, JSON.stringify(config.data, null, 2));
}

function jsonGetTableConfig(table) {
  jsonLoad();
  return tables[table];
}

function jsonFindAll(table) {
  jsonLoad();
  return tables[table].data;
}

function jsonFindById(table, id) {
  jsonLoad();
  const numId = Number(id);
  return tables[table].data.find((r) => r.id === numId) || null;
}

function jsonFindBy(table, field, value) {
  jsonLoad();
  return tables[table].data.filter((r) => r[field] === value);
}

function jsonInsert(table, data) {
  jsonLoad();
  const id = nextIds[table]++;
  const record = { id, ...data, created_at: data.created_at, updated_at: data.updated_at };
  tables[table].data.push(record);
  jsonSave(table);
  return record;
}

function jsonUpdate(table, id, data) {
  jsonLoad();
  const numId = Number(id);
  const index = tables[table].data.findIndex((r) => r.id === numId);
  if (index === -1) return null;
  tables[table].data[index] = { ...tables[table].data[index], ...data, id: numId };
  jsonSave(table);
  return tables[table].data[index];
}

function jsonRemove(table, id) {
  jsonLoad();
  const numId = Number(id);
  const index = tables[table].data.findIndex((r) => r.id === numId);
  if (index === -1) return false;
  tables[table].data.splice(index, 1);
  jsonSave(table);
  return true;
}

function jsonGetNextId(table) {
  jsonLoad();
  return nextIds[table];
}

function jsonReset() {
  for (const config of Object.values(tables)) {
    config.data = [];
  }
  for (const key of Object.keys(nextIds)) {
    nextIds[key] = 1;
  }
  loaded = true;
}
