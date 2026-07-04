import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

export async function migrate() {
  if (!DATABASE_URL) {
    console.log('⚠  DATABASE_URL non définie — utilisation des fichiers JSON');
    return;
  }

  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('→ Exécution du schéma...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✓ Schéma créé');

    console.log('→ Insertion des données initiales...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
    await pool.query(seed);
    console.log('✓ Données initiales insérées');
  } catch (err) {
    console.error('Erreur lors de la migration:', err.message);
  } finally {
    await pool.end();
  }
}
