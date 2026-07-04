import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import * as db from '../../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const dataFiles = ['banks.json', 'accounts.json', 'transactions.json'];
const savedSnapshots = {};
for (const file of dataFiles) {
  const fp = path.join(DATA_DIR, file);
  try { savedSnapshots[file] = fs.readFileSync(fp, 'utf-8'); } catch { savedSnapshots[file] = '[]'; }
}
function restoreDataFiles() {
  for (const file of dataFiles) {
    fs.writeFileSync(path.join(DATA_DIR, file), savedSnapshots[file]);
  }
}
function clearDataFiles() {
  for (const file of dataFiles) {
    fs.writeFileSync(path.join(DATA_DIR, file), '[]');
  }
}

describe('db (in-memory operations)', () => {
  beforeEach(async () => {
    await db.reset();
  });

  afterAll(() => {
    restoreDataFiles();
  });

  it('findAll retourne un tableau vide après reset', async () => {
    expect(await db.findAll('banks')).toEqual([]);
    expect(await db.findAll('accounts')).toEqual([]);
    expect(await db.findAll('transactions')).toEqual([]);
  });

  it('insert ajoute un enregistrement avec id et dates', async () => {
    const record = await db.insert('banks', { name: 'Test', code: 'TST' });
    expect(record.id).toBe(1);
    expect(record.name).toBe('Test');
    expect(record.code).toBe('TST');
    expect(record.created_at).toBeDefined();
    expect(record.updated_at).toBeDefined();
  });

  it('insert incrémente les ids', async () => {
    await db.insert('banks', { name: 'A', code: 'A' });
    await db.insert('banks', { name: 'B', code: 'B' });
    expect(await db.findAll('banks')).toHaveLength(2);
    expect((await db.findAll('banks'))[1].id).toBe(2);
  });

  it('findById retourne un enregistrement par id', async () => {
    const inserted = await db.insert('banks', { name: 'Test', code: 'TST' });
    expect(await db.findById('banks', inserted.id)).toEqual(inserted);
  });

  it('findById retourne null si introuvable', async () => {
    expect(await db.findById('banks', 999)).toBeNull();
  });

  it('findById accepte un id string', async () => {
    const inserted = await db.insert('banks', { name: 'Test', code: 'TST' });
    expect(await db.findById('banks', String(inserted.id))).toEqual(inserted);
  });

  it('findBy filtre par champ', async () => {
    await db.insert('banks', { name: 'Alpha', code: 'A' });
    await db.insert('banks', { name: 'Beta', code: 'B' });
    const results = await db.findBy('banks', 'code', 'A');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Alpha');
  });

  it('update modifie un enregistrement', async () => {
    const inserted = await db.insert('banks', { name: 'Old', code: 'OLD' });
    const updated = await db.update('banks', inserted.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.code).toBe('OLD');
    expect((await db.findById('banks', inserted.id)).name).toBe('New');
  });

  it('update retourne null si introuvable', async () => {
    expect(await db.update('banks', 999, {})).toBeNull();
  });

  it('remove supprime un enregistrement', async () => {
    const inserted = await db.insert('banks', { name: 'Test', code: 'TST' });
    expect(await db.remove('banks', inserted.id)).toBe(true);
    expect(await db.findById('banks', inserted.id)).toBeNull();
  });

  it('remove retourne false si introuvable', async () => {
    expect(await db.remove('banks', 999)).toBe(false);
  });

  it('getTableConfig retourne la config d\'une table', async () => {
    const config = await db.getTableConfig('banks');
    expect(config).toBeDefined();
    expect(config.data).toEqual([]);
  });

  it('getNextId retourne le prochain id', async () => {
    expect(await db.getNextId('banks')).toBe(1);
    await db.insert('banks', { name: 'Test', code: 'TST' });
    expect(await db.getNextId('banks')).toBe(2);
  });

  it('reset vide toutes les tables', async () => {
    await db.insert('banks', { name: 'Test', code: 'TST' });
    await db.insert('accounts', { owner_name: 'John' });
    await db.reset();
    expect(await db.findAll('banks')).toHaveLength(0);
    expect(await db.findAll('accounts')).toHaveLength(0);
    expect(await db.findAll('transactions')).toHaveLength(0);
    expect(await db.getNextId('banks')).toBe(1);
  });
});

describe('db (disk load)', () => {
  afterAll(() => {
    restoreDataFiles();
  });

  it('charge les données depuis le disque au premier appel', async () => {
    clearDataFiles();
    fs.writeFileSync(
      path.join(DATA_DIR, 'banks.json'),
      JSON.stringify([{ id: 42, name: 'Disk Bank', code: 'DSK' }], null, 2)
    );

    vi.resetModules();
    const freshDb = await import('../../src/db.js');
    const banks = await freshDb.findAll('banks');
    expect(banks).toHaveLength(1);
    expect(banks[0].id).toBe(42);
    expect(banks[0].name).toBe('Disk Bank');

    const nextId = await freshDb.getNextId('banks');
    expect(nextId).toBe(43);
  });

  it('gère les fichiers JSON invalides en retournant un tableau vide', async () => {
    clearDataFiles();
    fs.writeFileSync(path.join(DATA_DIR, 'banks.json'), 'not valid json');

    vi.resetModules();
    const freshDb = await import('../../src/db.js');
    expect(await freshDb.findAll('banks')).toEqual([]);
  });

  it('gère les fichiers manquants en retournant un tableau vide', async () => {
    clearDataFiles();
    fs.rmSync(path.join(DATA_DIR, 'banks.json'), { force: true });

    vi.resetModules();
    const freshDb = await import('../../src/db.js');
    expect(await freshDb.findAll('banks')).toEqual([]);
  });
});
