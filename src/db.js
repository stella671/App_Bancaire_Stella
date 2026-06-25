import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

const tables = {
  banks: { file: path.join(DATA_DIR, 'banks.json'), data: null },
  accounts: { file: path.join(DATA_DIR, 'accounts.json'), data: null },
  transactions: { file: path.join(DATA_DIR, 'transactions.json'), data: null },
  archived_transactions: { file: path.join(DATA_DIR, 'archived_transactions.json'), data: null },
  users: { file: path.join(DATA_DIR, 'users.json'), data: null },
};

const nextIds = { banks: 1, accounts: 1, transactions: 1, users: 2, archived_transactions: 1 };
let loaded = false;

function load() {
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

export function save(table) {
  const config = tables[table];
  fs.writeFileSync(config.file, JSON.stringify(config.data, null, 2));
}

export function getTableConfig(table) {
  load();
  return tables[table];
}

export function findAll(table) {
  load();
  return tables[table].data;
}

export function findById(table, id) {
  load();
  const numId = Number(id);
  return tables[table].data.find((r) => r.id === numId) || null;
}

export function findBy(table, field, value) {
  load();
  return tables[table].data.filter((r) => r[field] === value);
}

export function insert(table, data) {
  load();
  const id = nextIds[table]++;
  const now = new Date().toISOString();
  const record = { id, ...data, created_at: now, updated_at: now };
  tables[table].data.push(record);
  save(table);
  return record;
}

export function update(table, id, data) {
  load();
  const numId = Number(id);
  const index = tables[table].data.findIndex((r) => r.id === numId);
  if (index === -1) return null;
  const now = new Date().toISOString();
  tables[table].data[index] = { ...tables[table].data[index], ...data, id: numId, updated_at: now };
  save(table);
  return tables[table].data[index];
}

export function remove(table, id) {
  load();
  const numId = Number(id);
  const index = tables[table].data.findIndex((r) => r.id === numId);
  if (index === -1) return false;
  tables[table].data.splice(index, 1);
  save(table);
  return true;
}

export function getNextId(table) {
  load();
  return nextIds[table];
}

export function reset() {
  for (const config of Object.values(tables)) {
    config.data = [];
  }
  for (const key of Object.keys(nextIds)) {
    nextIds[key] = 1;
  }
  loaded = true;
}
